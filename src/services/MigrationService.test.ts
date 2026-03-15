import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MigrationService } from './MigrationService';
import LEGACY_DATA_1 from './test-data/example-legacy-data_1.json';
import LEGACY_DATA_2 from './test-data/example-legacy-data_2.json';

// Mock the Chrome API
const chromeMock = {
  storage: {
    sync: { get: vi.fn(), set: vi.fn(), clear: vi.fn() },
    local: { get: vi.fn(), set: vi.fn(), clear: vi.fn() },
  },
};
vi.stubGlobal('chrome', chromeMock);

describe('MigrationService - Deep Logic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Boolean & Number Parsing (toBool / toNumber)', () => {
    it.each([
      ['true', true],
      [true, true],
      ['false', false],
      [false, false],
      [undefined, true], // testing fallback
      ['random', true], // testing fallback
    ])('toBool(%s) should result in %s', (input, expected) => {
      // @ts-expect-error - accessing private static for testing
      expect(MigrationService.toBool(input, true)).toBe(expected);
    });

    it.each([
      ['10', 10],
      [5, 5],
      [0, 0],
      [-1, -1],
      ['-10', -10],
      ['invalid', 20], // testing fallback
      [undefined, 20],
      ['', 0],
      [{}, 20],
    ])('toNumber(%s) should result in %s', (input, expected) => {
      // @ts-expect-error
      expect(MigrationService.toNumber(input, 20)).toBe(expected);
    });
  });

  describe('Date Parsing (parseLegacyDate)', () => {
    it('should parse standard legacy format "16/02/2025, 22:15:14"', () => {
      // @ts-expect-error
      const result = MigrationService.parseLegacyDate('16/02/2025, 22:15:14');
      expect(result).toBe('2025-02-16T22:15:14.000Z');
    });

    it('should parse standard legacy format "16.02.2025, 22:15:14"', () => {
      // @ts-expect-error
      const result = MigrationService.parseLegacyDate('16.02.2025, 22:15:14');
      expect(result).toBe('2025-02-16T22:15:14.000Z');
    });

    it('should handle single digit dates "1/1/2025, 1:1:1"', () => {
      // @ts-expect-error
      const result = MigrationService.parseLegacyDate('1/1/2025, 1:1:1');
      expect(result).toBe('2025-01-01T01:01:01.000Z');
    });

    it('should handle an obvious middle-endian date', () => {
      // @ts-expect-error
      const result = MigrationService.parseLegacyDate('11/30/2025, 22:15:14');
      expect(result).toContain('2025-11-30T22:15:14.000Z');
    });

    it('should fallback to current ISO string on garbage input', () => {
      const now = new Date().toISOString().split('T')[0];
      // @ts-expect-error
      const result = MigrationService.parseLegacyDate('totally-broken-string');
      expect(result).toContain(now);
    });
  });

  describe('Schedule Parsing (mapStartAndEndToWindows)', () => {
    it('should map overnight times to multiple windows (enforce end > start)', () => {
      // @ts-expect-error
      const spy = vi.spyOn(MigrationService, 'shiftDaysForward');
      const old = LEGACY_DATA_2.options;
      // @ts-expect-error
      const result = MigrationService.mapStartAndEndToWindows(old);
      expect(result).length(2);
      expect(spy).toHaveBeenCalledTimes(1);

      expect(result[0].days[0]).toBe(false);
      expect(result[0].days[6]).toBe(true);
      expect(result[0].days[5]).toBe(true);

      expect(result[1].days[0]).toBe(true);
      expect(result[1].days[6]).toBe(true);
      expect(result[1].days[5]).toBe(false);
    });

    it('should map overnight windows ending at midnight to one valid window', () => {
      const old = {
        ...LEGACY_DATA_2.options,
        activeTimes: {
          value: {
            allDay: { value: false },
            start: { value: '23:00' },
            end: { value: '00:00' },
          },
        },
      };

      // @ts-expect-error - testing private method directly
      const result = MigrationService.mapStartAndEndToWindows(old);

      expect(result).toEqual([
        {
          days: [false, false, false, false, false, true, true],
          start: '23:00',
          end: '23:59',
        },
      ]);
    });
  });

  describe('Rule Mapping (mapRules)', () => {
    it('should map legacy isByPath=true to prefix and false to exact', () => {
      const oldRules = [
        { id: 'a', hostname: 'reddit.com/r/aita', isByPath: true, dateAdded: '16/02/2025, 22:15:14', unblocked: false },
        {
          id: 'b',
          hostname: 'reddit.com/r/aita',
          isByPath: false,
          dateAdded: '16/02/2025, 22:15:14',
          unblocked: false,
        },
      ];

      // @ts-expect-error - testing private method directly
      const mapped = MigrationService.mapRules(oldRules);

      expect(mapped[0].matchType).toBe('prefix');
      expect(mapped[1].matchType).toBe('exact');
    });
  });

  describe('Full Migration - Real World Scenario', () => {
    it('should not migrate if version 3 already exists', async () => {
      // Simulate version 3 already being there
      chromeMock.storage.local.get.mockResolvedValue({ version: 3 });

      await MigrationService.migrate();

      // Verify sync.get was never even called
      expect(chromeMock.storage.sync.get).not.toHaveBeenCalled();
    });

    it('should migrate complex legacy object to clean types (1)', async () => {
      const realLegacyData = LEGACY_DATA_1;
      chromeMock.storage.local.get.mockResolvedValue({});
      chromeMock.storage.sync.get.mockResolvedValue(realLegacyData);
      await MigrationService.migrate();

      const [calls] = chromeMock.storage.local.set.mock.calls[0];

      // Check Settings
      expect(calls.settings.holdDurationSeconds).toBe(6);
      expect(calls.settings.extendedUnblock.enabled).toBe(true);
      expect(calls.settings.schedule.windows[0].days[1]).toBe(true); // Tuesday was string true
      expect(calls.settings.schedule.windows[0].days[2]).toBe(false); // Wednesday was boolean false
      expect(calls.settings.schedule.windows[0].start).toBe('09:00');

      // Check Rules
      expect(calls.rules).toHaveLength(2);
      expect(calls.rules[0].enabled).toBe(true); // unblocked: "false" means enabled: true
      expect(calls.rules[0].createdAt).toBe('2025-02-16T22:15:14.000Z'); // 16/02/2025, 22:15:14
    });
  });
});
