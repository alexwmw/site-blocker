import type { LegacyOptions, LegacyProvider } from '../types/legacy-schema';
import type {
  BlockRule,
  Schedule,
  ScheduleDays,
  ScheduleWindow,
  Settings,
  StorageSchema,
  Theme,
} from '../types/schema';
import { storageSchema, THEMES, TIME_REGEX } from '../types/schema';
import { createUniqueId } from '../utils/createUniqueId';

import defaultSettings from './defaultSettings';

export class MigrationService {
  private static toBool(val: string | boolean | undefined, fallback: boolean): boolean {
    if (val === 'true' || val === true) {
      return true;
    }
    if (val === 'false' || val === false) {
      return false;
    }
    return fallback;
  }

  private static toNumber(value: string | number | undefined, fallback: number): number {
    const n = Number(value ?? fallback);

    if (Number.isNaN(n)) {
      return fallback;
    }
    return n;
  }

  private static toHoursMinutesString(value: string | undefined, fallback: string): string {
    if (typeof value !== 'string') {
      return fallback;
    }
    return Boolean(value.trim().match(TIME_REGEX)) ? value.trim() : fallback;
  }

  private static isTheme(value: unknown): value is Theme {
    return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
  }

  private static toTheme(value: string | undefined, fallback: Theme): Theme {
    if (typeof value !== 'string') {
      return fallback;
    }
    const stringValue = value.toLowerCase(); // Legacy values are capitalised
    return this.isTheme(stringValue) ? stringValue : fallback;
  }

  private static parseLegacyActiveDays(old: LegacyOptions, fallback: ScheduleDays): ScheduleDays {
    const oldActiveDays = old.activeDays?.value ?? [];
    if (oldActiveDays.length === 7) {
      return oldActiveDays.map((day) => this.toBool(day.value, false)) as ScheduleDays;
    }
    return fallback;
  }

  private static parseLegacyDate(dateStr: string | undefined): string {
    if (!dateStr) {
      return new Date().toISOString();
    }

    try {
      const [datePart, timePart] = dateStr.split(', ');
      const [v1, v2, year] = datePart.split(/[./-]/u).map(Number);
      const [h, m, s] = (timePart || '00:00:00').split(':').map(Number);

      let day = v1;
      let month = v2;

      // SMART SWAP: If the second number is > 12, the first MUST be the month (US style)
      if (v2 > 12 && v1 <= 12) {
        month = v1;
        day = v2;
      }
      // If BOTH are <= 12, we assume DD/MM, but it's a guess.

      // Filter out dates greater than DD 31 / MM 12
      if (day > 31 || month > 12) {
        throw new Error('Invalid date');
      }

      const date = new Date(year, month - 1, day, h, m, s);

      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  private static shiftDaysForward(days: ScheduleDays): ScheduleDays {
    return [
      days[6], // Sunday -> Monday
      days[0], // Monday -> Tuesday
      days[1], // Tuesday -> Wednesday
      days[2], // Wednesday -> Thursday
      days[3], // Thursday -> Friday
      days[4], // Friday -> Saturday
      days[5], // Saturday -> Sunday
    ];
  }

  private static addOneMinute(time: string): string {
    const [h, m] = time.split(':').map(Number);

    const total = (h * 60 + m + 1) % (24 * 60);

    const hours = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');

    const minutes = (total % 60).toString().padStart(2, '0');

    return `${hours}:${minutes}`;
  }

  private static mapStartAndEndToWindows(old: LegacyOptions): ScheduleWindow[] {
    const allDay = this.toBool(old.activeTimes?.value?.allDay?.value, false);
    const days = this.parseLegacyActiveDays(old, defaultSettings.schedule.windows[0].days);
    if (allDay) {
      return [
        {
          start: '00:00',
          end: '23:59',
          days,
        },
      ];
    }
    const start = this.toHoursMinutesString(
      old.activeTimes?.value?.start?.value,
      defaultSettings.schedule.windows[0].start,
    );
    const end = this.toHoursMinutesString(old.activeTimes?.value?.end?.value, defaultSettings.schedule.windows[0].end);
    if (end > start) {
      return [{ days, end, start }];
    }
    if (end === start) {
      return [
        {
          start,
          end: this.addOneMinute(end),
          days,
        },
      ];
    }
    return [
      { days, start, end: '23:59' },
      { days: this.shiftDaysForward(days), start: '00:00', end },
    ];
  }

  private static mapSchedule(old: LegacyOptions): Schedule {
    const windows: ScheduleWindow[] = this.mapStartAndEndToWindows(old);

    return {
      enabled: this.toBool(old.scheduleBlocking?.value, defaultSettings.schedule.enabled),
      windows,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private static mapSettings(old: LegacyOptions): Settings {
    return {
      theme: this.toTheme(old.theme?.value, defaultSettings.theme),
      holdDurationSeconds: this.toNumber(old.unblockTimeout?.value, defaultSettings.holdDurationSeconds),
      extendedUnblock: {
        enabled: this.toBool(old.allowRevisits?.value, defaultSettings.extendedUnblock.enabled),
        durationMinutes: this.toNumber(old.revisitLimit?.value, defaultSettings.extendedUnblock.durationMinutes),
      },
      isRated: this.toBool(old.isRated?.value, defaultSettings.isRated),
      schedule: this.mapSchedule(old),
    };
  }

  private static mapRules(oldRules: unknown): BlockRule[] {
    if (!Array.isArray(oldRules)) {
      return [];
    }
    const newRules: BlockRule[] = [];

    for (const rule of oldRules as LegacyProvider[]) {
      if (!rule.id || !rule.hostname) {
        continue;
      }
      const newRule: BlockRule = {
        id: createUniqueId(),
        pattern: rule.hostname,
        // Legacy semantics:
        // - isByPath=true  => match page and descendants (prefix)
        // - isByPath=false => match exact page only
        matchType: this.toBool(rule.isByPath, true) ? 'prefix' : 'exact',
        createdAt: this.parseLegacyDate(rule.dateAdded),
        enabled: !this.toBool(rule.unblocked, false),
      };

      newRules.push(newRule);
    }
    return newRules;
  }

  static async migrate(): Promise<void> {
    const current = await chrome.storage.local.get('version');

    if (current?.version === 3) {
      console.log('Current data does not require migration.');
      return;
    }

    const legacy = await chrome.storage.sync.get();

    if (legacy) {
      console.log('Legacy data found - attempting migration.');
    } else {
      console.log('No legacy data found - proceeding with defaults.');
    }

    const rawMigratedData: StorageSchema = {
      version: 3,
      settings: legacy.options ? this.mapSettings(legacy.options) : defaultSettings,
      rules: legacy.providers ? this.mapRules(legacy.providers) : [],
    };

    const result = storageSchema.safeParse(rawMigratedData);

    if (result.success) {
      await chrome.storage.local.set(result.data);
      // -- do not clear, because data will be lost if using the extension on more than once device
      // await chrome.storage.sync.clear();
      console.log('Migration complete:', result.data);
    } else {
      console.error('Migration failed validation:', result.error.flatten());
      await chrome.storage.local.set({
        version: 3,
        settings: defaultSettings,
        rules: [],
      });
    }
  }
}
