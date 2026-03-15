import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BlockRule, Schedule } from '../types/schema';

import defaultSettings from './defaultSettings';
import { StorageService } from './StorageService';

// Mock Chrome Storage
const storageMock = {
  local: {
    get: vi.fn(),
    set: vi.fn(),
  },
};
vi.stubGlobal('chrome', { storage: storageMock });

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default settings if storage is empty', async () => {
    storageMock.local.get.mockResolvedValue({});
    const settings = await StorageService.getSettings();
    expect(settings).toEqual(defaultSettings);
  });

  it('should correctly merge nested schedule updates', async () => {
    // 1. Initial State
    storageMock.local.get.mockResolvedValue({
      settings: { ...defaultSettings, theme: 'light' },
    });

    // 2. Update just the schedule toggle
    await StorageService.updateSettings({
      schedule: { enabled: false } as Schedule, // partial update
    });

    // 3. Verify the set call
    const [[setCall]] = storageMock.local.set.mock.calls;
    expect(setCall.settings.theme).toBe('light'); // Preserved
    expect(setCall.settings.schedule.enabled).toBe(false); // Updated
    expect(setCall.settings.schedule.windows[0].days).toEqual(defaultSettings.schedule.windows[0].days); // Preserved!
  });

  it('should throw an error if updateSettings receives invalid types', async () => {
    storageMock.local.get.mockResolvedValue({ settings: defaultSettings });

    // Trying to pass a string to a number field
    await expect(StorageService.updateSettings({ holdDurationSeconds: 'not-a-number' } as never)).rejects.toThrow();
  });

  it('should update specific properties on specific rules and leave all else unchanged', async () => {
    const rules: BlockRule[] = [
      { id: '1', pattern: 'string', matchType: 'prefix', createdAt: new Date().toISOString(), enabled: true },
      { id: '2', pattern: 'another', matchType: 'prefix', createdAt: new Date().toISOString(), enabled: true },
    ];
    storageMock.local.get.mockResolvedValue({ rules });

    await StorageService.updateRule('1', {
      pattern: 'test-pattern',
    });

    const [[setCall]] = storageMock.local.set.mock.calls;

    expect(setCall.rules).toHaveLength(2);
    expect(setCall.rules[0]).not.toBe(rules[0]); // to be a new object

    expect(setCall.rules[0].pattern).toBe('test-pattern');
    expect(setCall.rules[0]).toStrictEqual({
      ...rules[0],
      pattern: 'test-pattern',
    });
    expect(setCall.rules[1]).toStrictEqual(rules[1]);
  });

  it('should add a rule when no duplicate exists', async () => {
    const rules: BlockRule[] = [
      {
        id: '1',
        pattern: 'reddit.com/r/typescript',
        matchType: 'prefix',
        createdAt: new Date().toISOString(),
        enabled: true,
      },
    ];
    const newRule: BlockRule = {
      id: '2',
      pattern: 'news.ycombinator.com',
      matchType: 'prefix',
      createdAt: new Date().toISOString(),
      enabled: true,
    };
    storageMock.local.get.mockResolvedValue({ rules });

    const result = await StorageService.addRule(newRule);

    expect(result).toStrictEqual({ ok: true });
    const [[setCall]] = storageMock.local.set.mock.calls;
    expect(setCall.rules).toHaveLength(2);
    expect(setCall.rules[1]).toStrictEqual(newRule);
  });

  it('should reject a duplicate rule when canonical pattern already exists', async () => {
    const existingRule: BlockRule = {
      id: '1',
      pattern: 'https://www.Reddit.com/r/typescript/?sort=top',
      matchType: 'exact',
      createdAt: new Date().toISOString(),
      enabled: true,
    };
    const newRule: BlockRule = {
      id: '2',
      pattern: 'reddit.com/r/typescript',
      matchType: 'prefix',
      createdAt: new Date().toISOString(),
      enabled: true,
    };
    storageMock.local.get.mockResolvedValue({ rules: [existingRule] });

    const result = await StorageService.addRule(newRule);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Duplicate rule(s) exist');
    expect(result.duplicateRules).toStrictEqual([existingRule]);
    expect(storageMock.local.set).not.toHaveBeenCalled();
  });

  it('should filter out the correct rule when removing', async () => {
    const rules: BlockRule[] = [
      { id: '1', pattern: 'string', matchType: 'prefix', createdAt: new Date().toISOString(), enabled: true },
      { id: '2', pattern: 'string', matchType: 'prefix', createdAt: new Date().toISOString(), enabled: true },
    ];
    storageMock.local.get.mockResolvedValue({ rules });

    await StorageService.removeRule('1');

    const [[setCall]] = storageMock.local.set.mock.calls;
    expect(setCall.rules).toHaveLength(1);
    expect(setCall.rules[0].id).toBe('2');
  });
});
