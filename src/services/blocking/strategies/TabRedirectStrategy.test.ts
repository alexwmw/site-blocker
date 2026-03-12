import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BlockRule, Settings } from '../../../types/schema';
import { StorageService } from '../../StorageService';

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

describe('TabRedirectStrategy.handleUnblock', () => {
  const tabsUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal('chrome', {
      tabs: {
        update: tabsUpdate,
      },
    });
  });

  it('returns success when all rule IDs are valid', async () => {
    const strategy = new TabRedirectStrategy();
    const updateRuleSpy = vi.spyOn(StorageService, 'updateRule').mockResolvedValue(makeRule());
    await strategy.sync([makeRule()], defaultSettings);

    const result = await strategy.handleUnblock(['rule-1'], 'https://reddit.com/r/aita', 24);

    expect(result).toEqual({ ok: true });
    expect(updateRuleSpy).toHaveBeenCalledTimes(1);
    expect(tabsUpdate).toHaveBeenCalledWith(24, { url: 'https://reddit.com/r/aita' });
  });

  it('returns explicit failure and still navigates when at least one rule ID is missing', async () => {
    const strategy = new TabRedirectStrategy();
    const updateRuleSpy = vi
      .spyOn(StorageService, 'updateRule')
      .mockResolvedValueOnce(makeRule({ id: 'rule-1' }))
      .mockResolvedValueOnce(null);
    await strategy.sync([makeRule()], defaultSettings);

    const result = await strategy.handleUnblock(['rule-1', 'missing-rule'], 'https://reddit.com/r/aita', 24);

    expect(updateRuleSpy).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: false, reason: 'One or more rules were not found.' });
    expect(tabsUpdate).toHaveBeenCalledWith(24, { url: 'https://reddit.com/r/aita' });
  });
});
