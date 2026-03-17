import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BlockRule, Settings } from '../../../../types/schema';
import { StorageService } from '../../../StorageService';

import DnrStrategy from './DnrStrategy';

const defaultSettings: Settings = {
  theme: 'light',
  blockPageHeadline: 'Stay on track',
  holdDurationSeconds: 20,
  isRated: false,
  schedule: {
    enabled: true,
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

const makeRule = (overrides: Partial<BlockRule> = {}): BlockRule => ({
  id: 'rule-1',
  pattern: 'reddit.com/r/aita',
  matchType: 'prefix',
  createdAt: '2026-01-01T00:00:00.000Z',
  enabled: true,
  ...overrides,
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
