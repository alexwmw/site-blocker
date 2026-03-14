import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BlockRule, Settings } from '../../../types/schema';
import { StorageService } from '../../StorageService';
import { getBlockPageUrl } from '../getBlockPageUrl';
import { createEvent } from '../test-utils';

import TabRedirectStrategy from './TabRedirectStrategy';

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
  extendedUnblock: {
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
  const startedStrategies: TabRedirectStrategy[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    startedStrategies.length = 0;

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

  afterEach(async () => {
    await Promise.all(startedStrategies.map((strategy) => strategy.stop()));
  });

  it('registers and unregisters tab listeners on start/stop', async () => {
    const strategy = new TabRedirectStrategy();

    await strategy.start();
    startedStrategies.push(strategy);
    await strategy.stop();

    expect(onUpdated.addListener).toHaveBeenCalledTimes(1);
    expect(onActivated.addListener).toHaveBeenCalledTimes(1);
    expect(onUpdated.removeListener).toHaveBeenCalledTimes(1);
    expect(onActivated.removeListener).toHaveBeenCalledTimes(1);
  });

  it('redirects matching navigations to block page after sync', async () => {
    const strategy = new TabRedirectStrategy();
    await strategy.sync({ rules: [makeRule()], settings: defaultSettings });
    await strategy.start();
    startedStrategies.push(strategy);

    onUpdated.emit(11, { url: 'https://reddit.com/r/aita/comments/123' }, { id: 11 } as chrome.tabs.Tab);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(tabsUpdate).toHaveBeenCalledTimes(1);
    const [tabId, updateProperties] = tabsUpdate.mock.calls[0] as [number, chrome.tabs.UpdateProperties];
    expect(tabId).toBe(11);
    expect(updateProperties.url).toContain(getBlockPageUrl());
    expect(updateProperties.url).toContain('ruleIds=rule-1');
  });

  it('does not redirect when a matching rule is temporarily unblocked', async () => {
    const strategy = new TabRedirectStrategy();
    await strategy.sync({ rules: [makeRule({ unblockUntil: Date.now() + 60_000 })], settings: defaultSettings });
    await strategy.start();
    startedStrategies.push(strategy);

    onUpdated.emit(11, { url: 'https://reddit.com/r/aita/comments/123' }, { id: 11 } as chrome.tabs.Tab);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(tabsUpdate).not.toHaveBeenCalled();
  });

  it('redirects again once unblock window has expired', async () => {
    const strategy = new TabRedirectStrategy();
    await strategy.sync({ rules: [makeRule({ unblockUntil: Date.now() - 1 })], settings: defaultSettings });
    await strategy.start();
    startedStrategies.push(strategy);

    onUpdated.emit(11, { url: 'https://reddit.com/r/aita/comments/123' }, { id: 11 } as chrome.tabs.Tab);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(tabsUpdate).toHaveBeenCalledTimes(1);
  });

  it('evaluates active tab url on tab activation events', async () => {
    tabsGet.mockResolvedValue({ id: 99, url: 'https://reddit.com/r/aita/comments/123' } as chrome.tabs.Tab);
    const strategy = new TabRedirectStrategy();
    await strategy.sync({ rules: [makeRule()], settings: defaultSettings });
    await strategy.start();
    startedStrategies.push(strategy);

    onActivated.emit({ tabId: 99, windowId: 1 });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(tabsGet).toHaveBeenCalledWith(99);
    expect(tabsUpdate).toHaveBeenCalledTimes(1);
  });

  it('handleUnblock updates unblock state and navigates sender tab back to target', async () => {
    const strategy = new TabRedirectStrategy();
    const updateRuleSpy = vi.spyOn(StorageService, 'updateRule').mockResolvedValue(makeRule());
    await strategy.sync({ rules: [makeRule()], settings: defaultSettings });

    const result = await strategy.handleUnblock(['rule-1'], 'https://reddit.com/r/aita', 24);

    expect(result).toEqual({ ok: true });
    expect(updateRuleSpy).toHaveBeenCalledTimes(1);
    expect(updateRuleSpy.mock.calls[0]?.[0]).toBe('rule-1');
    expect(tabsUpdate).toHaveBeenCalledWith(24, { url: 'https://reddit.com/r/aita' });
  });

  it('handleUnblock returns unsupported URL reason and does not mutate state', async () => {
    const strategy = new TabRedirectStrategy();
    const updateRuleSpy = vi.spyOn(StorageService, 'updateRule').mockResolvedValue(makeRule());
    await strategy.sync({ rules: [makeRule()], settings: defaultSettings });

    const result = await strategy.handleUnblock(['rule-1'], 'chrome://extensions', 24);

    expect(result).toEqual({ ok: false, reason: 'Unsupported target URL.' });
    expect(updateRuleSpy).not.toHaveBeenCalled();
    expect(tabsUpdate).not.toHaveBeenCalled();
  });

  it('returns explicit failure and still navigates when at least one rule ID is missing', async () => {
    const strategy = new TabRedirectStrategy();
    const updateRuleSpy = vi
      .spyOn(StorageService, 'updateRule')
      .mockResolvedValueOnce(makeRule({ id: 'rule-1' }))
      .mockResolvedValueOnce(null);
    await strategy.sync({ rules: [makeRule()], settings: defaultSettings });

    const result = await strategy.handleUnblock(['rule-1', 'missing-rule'], 'https://reddit.com/r/aita', 24);

    expect(updateRuleSpy).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: false, reason: 'One or more rules were not found.' });
    expect(tabsUpdate).toHaveBeenCalledWith(24, { url: 'https://reddit.com/r/aita' });
  });
});
