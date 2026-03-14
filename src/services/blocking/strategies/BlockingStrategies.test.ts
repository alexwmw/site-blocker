import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BlockRule, Settings } from '../../../types/schema';
import { StorageService } from '../../StorageService';
import { getBlockPageUrl } from '../getBlockPageUrl';
import { createEvent } from '../test-utils';

import DnrStrategy from './DnrStrategy';
import TabRedirectStrategy from './TabRedirectStrategy';

const defaultSettings: Settings = {
  theme: 'light',
  holdDurationSeconds: 20,
  isRated: false,
  schedule: {
    enabled: false,
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
    await Promise.resolve();

    await vi.waitFor(() => expect(tabsUpdate).toHaveBeenCalledTimes(1));
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
    await Promise.resolve();

    expect(tabsUpdate).not.toHaveBeenCalled();
  });

  it('redirects again once unblock window has expired', async () => {
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
          activeDays: [true, true, true, true, true, true, true],
          allDay: false,
          start: '11:00',
          end: '12:00',
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

  it('redirects inside overnight windows and carries activity across midnight from previous active day', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-06T00:30:00'));
    const strategy = new TabRedirectStrategy();
    await strategy.sync({
      rules: [makeRule()],
      settings: makeSettings({
        schedule: {
          enabled: true,
          activeDays: [true, false, false, false, false, false, false],
          allDay: false,
          start: '23:00',
          end: '01:00',
        },
      }),
    });
    await strategy.start();
    startedStrategies.push(strategy);

    onUpdated.emit(11, { url: 'https://reddit.com/r/aita/comments/123' }, { id: 11 } as chrome.tabs.Tab);
    await Promise.resolve();

    await vi.waitFor(() => expect(tabsUpdate).toHaveBeenCalledTimes(1));
    vi.useRealTimers();
  });

  it('treats disabled schedule as always-on blocking', async () => {
    const strategy = new TabRedirectStrategy();
    await strategy.sync({
      rules: [makeRule()],
      settings: makeSettings({
        schedule: {
          enabled: false,
          activeDays: [false, false, false, false, false, false, false],
          allDay: false,
          start: '23:00',
          end: '23:30',
        },
      }),
    });
    await strategy.start();
    startedStrategies.push(strategy);

    onUpdated.emit(11, { url: 'https://reddit.com/r/aita/comments/123' }, { id: 11 } as chrome.tabs.Tab);
    await Promise.resolve();

    await vi.waitFor(() => expect(tabsUpdate).toHaveBeenCalledTimes(1));
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

describe('DnrStrategy', () => {
  const getDynamicRules = vi.fn();
  const updateDynamicRules = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('chrome', {
      declarativeNetRequest: {
        RuleActionType: { REDIRECT: 'redirect' },
        ResourceType: { MAIN_FRAME: 'main_frame' },
        getDynamicRules,
        updateDynamicRules,
      },
      tabs: {
        update: vi.fn(),
      },
    });
  });


  it('sync replaces stale dynamic rules with current enabled rules', async () => {
    getDynamicRules.mockResolvedValue([{ id: 1000001 }, { id: 4 }]);
    const strategy = new DnrStrategy();

    await strategy.start();
    await strategy.sync({ rules: [makeRule(), makeRule({ id: 'rule-2', enabled: false })], settings: defaultSettings });

    expect(updateDynamicRules).toHaveBeenCalled();
    const lastCall = updateDynamicRules.mock.calls[
      updateDynamicRules.mock.calls.length - 1
    ]?.[0] as chrome.declarativeNetRequest.UpdateRuleOptions;
    expect(lastCall.removeRuleIds).toContain(1000001);
    expect(lastCall.addRules).toHaveLength(1);
    expect(lastCall.addRules?.[0]?.action).toEqual({
      type: 'redirect',
      redirect: { extensionPath: '/block-page.html' },
    });
    expect(lastCall.addRules?.[0]?.condition).toMatchObject({
      requestDomains: ['reddit.com'],
      urlFilter: '|http*://*/r/aita^',
    });
  });

  it('uses regexFilter for exact rules to preserve exact-path semantics with ports', async () => {
    getDynamicRules.mockResolvedValue([]);
    const strategy = new DnrStrategy();

    await strategy.start();
    await strategy.sync({
      rules: [makeRule({ matchType: 'exact', pattern: 'reddit.com/r/aita' })],
      settings: defaultSettings,
    });

    const lastCall = updateDynamicRules.mock.calls[
      updateDynamicRules.mock.calls.length - 1
    ]?.[0] as chrome.declarativeNetRequest.UpdateRuleOptions;
    expect(lastCall.addRules?.[0]?.condition).toMatchObject({
      requestDomains: ['reddit.com'],
    });
    expect(lastCall.addRules?.[0]?.condition).toHaveProperty('regexFilter');
    expect(lastCall.addRules?.[0]?.condition).not.toHaveProperty('urlFilter');
  });


  it('sync skips DNR rules outside active schedule window when schedule is enabled', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T10:00:00'));
    getDynamicRules.mockResolvedValue([]);
    const strategy = new DnrStrategy();

    await strategy.start();
    await strategy.sync({
      rules: [makeRule()],
      settings: makeSettings({
        schedule: {
          enabled: true,
          activeDays: [true, true, true, true, true, true, true],
          allDay: false,
          start: '11:00',
          end: '12:00',
        },
      }),
    });

    const lastCall = updateDynamicRules.mock.calls[
      updateDynamicRules.mock.calls.length - 1
    ]?.[0] as chrome.declarativeNetRequest.UpdateRuleOptions;
    expect(lastCall.addRules).toHaveLength(0);
    vi.useRealTimers();
  });

  it('settings sync toggles DNR blocking behavior from active to inactive schedule', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T10:00:00'));
    getDynamicRules.mockResolvedValue([]);
    const strategy = new DnrStrategy();

    await strategy.start();
    await strategy.sync({
      rules: [makeRule()],
      settings: makeSettings({
        schedule: {
          enabled: true,
          activeDays: [true, true, true, true, true, true, true],
          allDay: false,
          start: '09:00',
          end: '11:00',
        },
      }),
    });
    await strategy.sync({
      settings: makeSettings({
        schedule: {
          enabled: true,
          activeDays: [true, true, true, true, true, true, true],
          allDay: false,
          start: '11:00',
          end: '12:00',
        },
      }),
    });

    const firstSyncCall = updateDynamicRules.mock.calls[1]?.[0] as chrome.declarativeNetRequest.UpdateRuleOptions;
    const secondSyncCall = updateDynamicRules.mock.calls[2]?.[0] as chrome.declarativeNetRequest.UpdateRuleOptions;
    expect(firstSyncCall.addRules).toHaveLength(1);
    expect(secondSyncCall.addRules).toHaveLength(0);
    vi.useRealTimers();
  });

  it('stop removes managed rules explicitly', async () => {
    getDynamicRules
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 1000000 }]);
    const strategy = new DnrStrategy();

    await strategy.start();
    await strategy.sync({ rules: [makeRule()], settings: defaultSettings });
    await strategy.stop();

    const stopCall = updateDynamicRules.mock.calls[
      updateDynamicRules.mock.calls.length - 1
    ]?.[0] as chrome.declarativeNetRequest.UpdateRuleOptions;
    expect(stopCall.removeRuleIds).toEqual([1000000]);
  });

  it('handleUnblock unblocks matching rules and navigates sender tab', async () => {
    getDynamicRules.mockResolvedValue([{ id: 10001 }]);
    const tabsUpdate = vi.spyOn(chrome.tabs, 'update').mockResolvedValue();
    const updateRuleSpy = vi.spyOn(StorageService, 'updateRule').mockResolvedValue(makeRule());
    const strategy = new DnrStrategy();

    await strategy.start();
    await strategy.sync({ rules: [makeRule()], settings: defaultSettings });
    const result = await strategy.handleUnblock(['rule-1'], 'https://reddit.com/r/aita', 24);

    expect(result).toEqual({ ok: true });
    expect(updateRuleSpy).toHaveBeenCalledWith('rule-1', expect.objectContaining({ unblockUntil: expect.any(Number) }));
    expect(updateDynamicRules).toHaveBeenCalledTimes(3);
    expect(tabsUpdate).toHaveBeenCalledWith(24, { url: 'https://reddit.com/r/aita' });
  });

  it('handleUnblock does not abort when some rule IDs are missing', async () => {
    getDynamicRules.mockResolvedValue([{ id: 1000001 }]);
    const tabsUpdate = vi.spyOn(chrome.tabs, 'update').mockResolvedValue();
    const updateRuleSpy = vi
      .spyOn(StorageService, 'updateRule')
      .mockResolvedValueOnce(makeRule({ id: 'rule-1' }))
      .mockResolvedValueOnce(null);
    const strategy = new DnrStrategy();

    await strategy.start();
    await strategy.sync({ rules: [makeRule()], settings: defaultSettings });
    const result = await strategy.handleUnblock(['rule-1', 'missing-rule'], 'https://reddit.com/r/aita', 24);

    expect(updateRuleSpy).toHaveBeenCalledTimes(2);
    expect(updateDynamicRules).toHaveBeenCalledTimes(3);
    expect(tabsUpdate).toHaveBeenCalledWith(24, { url: 'https://reddit.com/r/aita' });
    expect(result).toEqual({ ok: false, reason: 'One or more rules were not found.' });
  });
});
