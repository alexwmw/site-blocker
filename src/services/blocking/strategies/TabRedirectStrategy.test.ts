import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BlockRule, Settings } from '../../../types/schema';
import { RulesService } from '../../RulesService';
import { StorageService } from '../../StorageService';
import { getBlockPageUrl } from '../getBlockPageUrl';
import { createEvent } from '../test-utils';

import TabRedirectStrategy from './TabRedirectStrategy';

const defaultSettings: Settings = {
  blockPageHeadline: 'Stay on track',
  theme: 'mindful-light',
  holdDurationSeconds: 20,
  isRated: false,
  schedule: {
    enabled: false,
    windows: [
      {
        days: [false, false, false, false, false, false, false],
        start: '00:00',
        end: '23:59',
      },
    ],
  },
  extendedUnblock: {
    enabled: true,
    durationMinutes: 10,
  },
};

const makeSettings = (overrides: Partial<Settings> = {}): Settings => ({
  ...defaultSettings,
  ...overrides,
  schedule: {
    ...defaultSettings.schedule,
    ...overrides.schedule,
  },
  extendedUnblock: {
    ...defaultSettings.extendedUnblock,
    ...overrides.extendedUnblock,
  },
});

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
  const onRemoved = createEvent<[number, chrome.tabs.OnUpdatedInfo]>();
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
        onRemoved,
        update: tabsUpdate,
        get: tabsGet,
      },
      runtime: {
        getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
      },
      storage: {
        local: {
          get: vi.fn(() => ({})),
        },
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

    expect(onUpdated.addListener).toHaveBeenCalledTimes(2);
    expect(onActivated.addListener).toHaveBeenCalledTimes(1);
    expect(onRemoved.addListener).toHaveBeenCalledTimes(1);
    expect(onUpdated.removeListener).toHaveBeenCalledTimes(2);
    expect(onActivated.removeListener).toHaveBeenCalledTimes(1);
  });

  it('redirects matching navigations to block page after sync', async () => {
    tabsGet.mockResolvedValue({ id: 99, url: 'https://reddit.com/r/aita/comments/123' } as chrome.tabs.Tab);
    const strategy = new TabRedirectStrategy();
    await strategy.sync({ rules: [makeRule()], settings: defaultSettings });
    await strategy.start();
    startedStrategies.push(strategy);

    onUpdated.emit(11, { url: 'https://reddit.com/r/aita/comments/123' }, { id: 11 } as chrome.tabs.Tab);
    await Promise.resolve();

    await vi.waitFor(() => expect(tabsUpdate).toHaveBeenCalledTimes(1));
    const [tabId, updateProperties] = tabsUpdate.mock.calls[0] as [number, chrome.tabs.UpdateProperties];
    expect(tabId).toBe(11);
    expect(updateProperties.url).toContain(getBlockPageUrl());
    expect(updateProperties.url).toContain('ruleIds=rule-1');
  });

  it('does not redirect when a matching rule is temporarily unblocked', async () => {
    tabsGet.mockResolvedValue({ id: 99, url: 'https://reddit.com/r/aita/comments/123' } as chrome.tabs.Tab);
    const strategy = new TabRedirectStrategy();
    await strategy.sync({ rules: [makeRule({ unblockUntil: Date.now() + 60_000 })], settings: defaultSettings });
    await strategy.start();
    startedStrategies.push(strategy);

    onUpdated.emit(11, { url: 'https://reddit.com/r/aita/comments/123' }, { id: 11 } as chrome.tabs.Tab);
    await Promise.resolve();

    expect(tabsUpdate).not.toHaveBeenCalled();
  });

  it('redirects again once unblock window has expired', async () => {
    tabsGet.mockResolvedValue({ id: 99, url: 'https://reddit.com/r/aita/comments/123' } as chrome.tabs.Tab);
    const strategy = new TabRedirectStrategy();
    await strategy.sync({ rules: [makeRule({ unblockUntil: Date.now() - 1 })], settings: defaultSettings });
    await strategy.start();
    startedStrategies.push(strategy);

    onUpdated.emit(11, { url: 'https://reddit.com/r/aita/comments/123' }, { id: 11 } as chrome.tabs.Tab);
    await Promise.resolve();

    await vi.waitFor(() => expect(tabsUpdate).toHaveBeenCalledTimes(1));
  });

  it('evaluates active tab url on tab activation events', async () => {
    tabsGet.mockResolvedValue({ id: 99, url: 'https://reddit.com/r/aita/comments/123' } as chrome.tabs.Tab);
    const strategy = new TabRedirectStrategy();
    await strategy.sync({ rules: [makeRule()], settings: defaultSettings });
    await strategy.start();
    startedStrategies.push(strategy);

    onActivated.emit({ tabId: 99, windowId: 1 });
    await Promise.resolve();

    expect(tabsGet).toHaveBeenCalledWith(99);
    await vi.waitFor(() => expect(tabsUpdate).toHaveBeenCalledTimes(1));
  });

  it('does not redirect outside of scheduled active window when schedule is enabled', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T10:00:00'));
    const strategy = new TabRedirectStrategy();
    await strategy.sync({
      rules: [makeRule()],
      settings: makeSettings({
        schedule: {
          enabled: true,
          windows: [
            {
              days: [true, true, true, true, true, true, true],
              start: '11:00',
              end: '12:00',
            },
          ],
        },
      }),
    });
    await strategy.start();
    startedStrategies.push(strategy);

    onUpdated.emit(11, { url: 'https://reddit.com/r/aita/comments/123' }, { id: 11 } as chrome.tabs.Tab);
    await Promise.resolve();

    expect(tabsUpdate).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('treats disabled schedule as always-on blocking', async () => {
    const strategy = new TabRedirectStrategy();
    await strategy.sync({
      rules: [makeRule()],
      settings: makeSettings({
        schedule: {
          enabled: false,
          windows: [
            {
              days: [false, false, false, false, false, false, false],
              start: '23:00',
              end: '23:30',
            },
          ],
        },
      }),
    });
    await strategy.start();
    startedStrategies.push(strategy);

    onUpdated.emit(11, { url: 'https://reddit.com/r/aita/comments/123' }, { id: 11 } as chrome.tabs.Tab);
    await Promise.resolve();

    await vi.waitFor(() => expect(tabsUpdate).toHaveBeenCalledTimes(1));
  });

  it('handleUnblock updates unblockUntil state when required and navigates sender tab back to target', async () => {
    const strategy = new TabRedirectStrategy();
    const updateRuleSpy = vi.spyOn(StorageService, 'updateRule').mockResolvedValue(makeRule());
    await strategy.sync({ rules: [makeRule()], settings: defaultSettings });

    const result = await strategy.handleUnblock(['rule-1'], 'https://reddit.com/r/aita', 24);

    expect(result).toEqual({ ok: true });
    expect(updateRuleSpy).toHaveBeenCalledTimes(1);
    expect(updateRuleSpy.mock.calls[0]?.[0]).toBe('rule-1');
  });

  it('handleUnblock navigates sender tab back to target - without extendedUnblock', async () => {
    const strategy = new TabRedirectStrategy();
    await strategy.sync({
      rules: [makeRule()],
      settings: {
        ...defaultSettings,
        extendedUnblock: {
          enabled: false,
          durationMinutes: NaN,
        },
      },
    });
    const updateRuleSpy = vi.spyOn(StorageService, 'updateRule').mockResolvedValue(makeRule());

    const result = await strategy.handleUnblock(['rule-1'], 'https://reddit.com/r/aita', 24);
    expect(updateRuleSpy).toHaveBeenCalledTimes(0);
    expect(result).toEqual({ ok: true });
  });

  it('does not re-block the sender tab while it is temporarily exempt', async () => {
    const strategy = new TabRedirectStrategy();
    await strategy.sync({ rules: [makeRule()], settings: defaultSettings });
    await strategy.start();

    tabsUpdate.mockResolvedValue(undefined);
    tabsGet.mockResolvedValue({ id: 123, url: 'https://example.com' });

    const findMatchingRulesSpy = vi.spyOn(RulesService, 'findMatchingRules');
    findMatchingRulesSpy.mockReturnValue([{ id: 'rule-1', pattern: 'example.com', matchType: 'exact' } as BlockRule]);

    await strategy.handleUnblock(['rule-1'], 'https://example.com', 123);

    tabsUpdate.mockClear();

    onUpdated.emit(123, { status: 'loading' }, {} as chrome.tabs.Tab);

    await Promise.resolve();
    await Promise.resolve();

    expect(tabsUpdate).not.toHaveBeenCalled();
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
    const warnSpy = vi.spyOn(console, 'warn');

    const result = await strategy.handleUnblock(['rule-1', 'missing-rule'], 'https://reddit.com/r/aita', 24);

    expect(updateRuleSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true });
  });
});
