import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BlockRule, Settings } from '../../../types/schema';
import { StorageService } from '../../StorageService';

import DnrStrategy from './DnrStrategy';
import TabRedirectStrategy from './TabRedirectStrategy';

type Listener<TArgs extends unknown[]> = (...args: TArgs) => void;

function createEvent<TArgs extends unknown[]>() {
  const listeners = new Set<Listener<TArgs>>();
  return {
    addListener: vi.fn((listener: Listener<TArgs>) => listeners.add(listener)),
    removeListener: vi.fn((listener: Listener<TArgs>) => listeners.delete(listener)),
    emit: (...args: TArgs) => {
      for (const listener of listeners) {
        listener(...args);
      }
    },
  };
}

const defaultSettings: Settings = {
  theme: 'light',
  holdDurationSeconds: 20,
  isRated: false,
  schedule: {
    enabled: true,
    activeDays: [false, false, false, false, false, false, false],
    allDay: false,
    start: '00:00',
    end: '23:59',
  },
  revisit: {
    enabled: true,
    durationMinutes: 10,
  },
};

const makeRule = (overrides: Partial<BlockRule> = {}): BlockRule => ({
  id: 'rule-1',
  pattern: 'reddit.com/r/aita',
  matchType: 'prefix',
  createdAt: '2026-01-01T00:00:00.000Z',
  enabled: true,
  ...overrides,
});

describe('TabRedirectStrategy', () => {
  const onUpdated = createEvent<[number, chrome.tabs.OnUpdatedInfo, chrome.tabs.Tab]>();
  const onActivated = createEvent<[chrome.tabs.OnActivatedInfo]>();

  const tabsUpdate = vi.fn();
  const tabsGet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal('chrome', {
      tabs: {
        onUpdated,
        onActivated,
        update: tabsUpdate,
        get: tabsGet,
      },
      runtime: {
        getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
      },
    });
  });

  it('registers and unregisters tab listeners on start/stop', async () => {
    const strategy = new TabRedirectStrategy();

    await strategy.start();
    await strategy.stop();

    expect(onUpdated.addListener).toHaveBeenCalledTimes(1);
    expect(onActivated.addListener).toHaveBeenCalledTimes(1);
    expect(onUpdated.removeListener).toHaveBeenCalledTimes(1);
    expect(onActivated.removeListener).toHaveBeenCalledTimes(1);
  });

  it('redirects matching navigations to block page after sync', async () => {
    const strategy = new TabRedirectStrategy();
    await strategy.sync([makeRule()], defaultSettings);
    await strategy.start();

    onUpdated.emit(11, { url: 'https://reddit.com/r/aita/comments/123' }, { id: 11 } as chrome.tabs.Tab);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(tabsUpdate).toHaveBeenCalledTimes(1);
    const [tabId, updateProperties] = tabsUpdate.mock.calls[0] as [number, chrome.tabs.UpdateProperties];
    expect(tabId).toBe(11);
    expect(updateProperties.url).toContain('chrome-extension://test/block-page.html?');
    expect(updateProperties.url).toContain('ruleId=rule-1');
  });

  it('handleUnblock updates unblock state and navigates sender tab back to target', async () => {
    const strategy = new TabRedirectStrategy();
    const updateRuleSpy = vi.spyOn(StorageService, 'updateRule').mockResolvedValue(makeRule());
    await strategy.sync([makeRule()], defaultSettings);

    const result = await strategy.handleUnblock('rule-1', 'https://reddit.com/r/aita', 24);

    expect(result).toEqual({ ok: true });
    expect(updateRuleSpy).toHaveBeenCalledTimes(1);
    expect(updateRuleSpy.mock.calls[0]?.[0]).toBe('rule-1');
    expect(tabsUpdate).toHaveBeenCalledWith(24, { url: 'https://reddit.com/r/aita' });
  });
});

describe('DnrStrategy', () => {
  const getDynamicRules = vi.fn();
  const updateDynamicRules = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('chrome', {
      declarativeNetRequest: {
        ResourceType: { MAIN_FRAME: 'main_frame' },
        getDynamicRules,
        updateDynamicRules,
      },
    });
  });

  it('sync replaces stale dynamic rules with current enabled rules', async () => {
    getDynamicRules.mockResolvedValue([{ id: 10001 }, { id: 4 }]);
    const strategy = new DnrStrategy();

    await strategy.start();
    await strategy.sync([makeRule(), makeRule({ id: 'rule-2', enabled: false })], defaultSettings);

    expect(updateDynamicRules).toHaveBeenCalled();
    const lastCall = updateDynamicRules.mock.calls[
      updateDynamicRules.mock.calls.length - 1
    ]?.[0] as chrome.declarativeNetRequest.UpdateRuleOptions;
    expect(lastCall.removeRuleIds).toContain(10001);
    expect(lastCall.addRules).toHaveLength(1);
  });

  it('stop removes managed rules explicitly', async () => {
    getDynamicRules.mockResolvedValue([]);
    const strategy = new DnrStrategy();

    await strategy.start();
    await strategy.sync([makeRule()], defaultSettings);
    await strategy.stop();

    const stopCall = updateDynamicRules.mock.calls[
      updateDynamicRules.mock.calls.length - 1
    ]?.[0] as chrome.declarativeNetRequest.UpdateRuleOptions;
    expect(stopCall.removeRuleIds?.length).toBe(1);
  });

  it('handleUnblock returns explicit unsupported reason', async () => {
    const strategy = new DnrStrategy();

    const result = await strategy.handleUnblock('rule-1', 'https://reddit.com');

    expect(result.ok).toBe(false);
    expect(result.reason).not.toBe('?');
  });
});
