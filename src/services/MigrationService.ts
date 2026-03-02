import type { LegacyOptions } from '../types/legacy-schema';
import type { ActiveDays, BlockRule, Settings, StorageSchema } from '../types/schema';
import { isTheme } from '../types/schema-utils';

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  holdDurationSeconds: 20,
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
  isRated: false,
};

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
    return Number(value ?? fallback);
  }

  private static toHoursMinutesString(value: string | undefined, fallback: string): string {
    if (typeof value !== 'string') {
      return fallback;
    }
    return Boolean(value.match(/^[0-2][0-9]:[0-5][0-9]$/u)) ? value : fallback;
  }

  private static parseLegacyActiveDays(old: LegacyOptions, fallback: ActiveDays): ActiveDays {
    const oldActiveDays = old.activeDays?.value ?? [];
    if (oldActiveDays.length === 7) {
      return oldActiveDays.map((day) => this.toBool(day.value, false)) as ActiveDays;
    }
    return fallback;
  }

  private static parseLegacyDate(dateStr: string | undefined): string {
    if (!dateStr) {
      return new Date().toISOString();
    }

    try {
      // Expected format: "16/02/2025, 22:15:14"
      // 1. Split date and time
      const [datePart, timePart] = dateStr.split(', ');
      if (!datePart || !timePart) {
        throw new Error('Invalid format');
      }

      // 2. Extract numbers from "16/02/2025"
      const [day, month, year] = datePart.split('/').map(Number);

      // 3. Extract numbers from "22:15:14"
      const [hours, minutes, seconds] = timePart.split(':').map(Number);

      // 4. Use the numeric constructor (Month is 0-indexed in JS!)
      const date = new Date(year, month - 1, day, hours, minutes, seconds);

      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    } catch {
      // If anything fails, fallback to 'now' to prevent migration crash
      return new Date().toISOString();
    }
  }

  private static mapSettings(old: LegacyOptions): Settings {
    return {
      theme: isTheme(old.theme?.value) ? old.theme.value : DEFAULT_SETTINGS.theme,
      holdDurationSeconds: this.toNumber(old.unblockTimeout?.value, DEFAULT_SETTINGS.holdDurationSeconds),
      revisit: {
        enabled: this.toBool(old.allowRevisits?.value, DEFAULT_SETTINGS.revisit.enabled),
        durationMinutes: this.toNumber(old.revisitLimit?.value, DEFAULT_SETTINGS.revisit.durationMinutes),
      },
      isRated: this.toBool(old.isRated?.value, DEFAULT_SETTINGS.isRated),
      schedule: {
        enabled: this.toBool(old.scheduleBlocking?.value, DEFAULT_SETTINGS.schedule.enabled),
        activeDays: this.parseLegacyActiveDays(old, DEFAULT_SETTINGS.schedule.activeDays),
        allDay: this.toBool(old.activeTimes?.value?.allDay?.value, DEFAULT_SETTINGS.schedule.allDay),
        start: this.toHoursMinutesString(old.activeTimes?.value?.start?.value, DEFAULT_SETTINGS.schedule.start),
        end: this.toHoursMinutesString(old.activeTimes?.value?.end?.value, DEFAULT_SETTINGS.schedule.end),
      },
    };
  }

  private static mapRules(oldRules: unknown): BlockRule[] {
    if (!Array.isArray(oldRules)) {
      return [];
    }
    const newRules: BlockRule[] = [];

    for (const rule of oldRules) {
      if (!rule.id || !rule.hostname) {
        continue;
      }
      const newRule: BlockRule = {
        id: rule.id,
        pattern: rule.hostname,
        matchType: rule.isByPath ? 'path' : 'domain',
        createdAt: this.parseLegacyDate(rule.dateAdded),
        enabled: !this.toBool(rule.unblocked, false),
      };

      newRules.push(newRule);
    }
    return newRules;
  }

  static async migrate(): Promise<void> {
    const legacy = await chrome.storage.sync.get();

    // If 'version' exists, we've already migrated
    if (legacy.version || !legacy.options) {
      return;
    }

    const migratedData: StorageSchema = {
      version: 3,
      settings: this.mapSettings(legacy.options),
      rules: this.mapRules(legacy.providers),
    };
    await chrome.storage.local.set(migratedData);
    console.log('Migration complete:', migratedData);
  }
}
