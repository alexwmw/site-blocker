import type { LegacyOptions } from '../types/legacy-schema';
import type { ActiveDays, BlockRule, Settings, StorageSchema } from '../types/schema';
import { storageSchema } from '../types/schema';
import { isTheme } from '../types/schema-utils';

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

  private static mapSettings(old: LegacyOptions): Settings {
    return {
      theme: isTheme(old.theme?.value) ? old.theme!.value : defaultSettings.theme,
      holdDurationSeconds: this.toNumber(old.unblockTimeout?.value, defaultSettings.holdDurationSeconds),
      revisit: {
        enabled: this.toBool(old.allowRevisits?.value, defaultSettings.revisit.enabled),
        durationMinutes: this.toNumber(old.revisitLimit?.value, defaultSettings.revisit.durationMinutes),
      },
      isRated: this.toBool(old.isRated?.value, defaultSettings.isRated),
      schedule: {
        enabled: this.toBool(old.scheduleBlocking?.value, defaultSettings.schedule.enabled),
        activeDays: this.parseLegacyActiveDays(old, defaultSettings.schedule.activeDays),
        allDay: this.toBool(old.activeTimes?.value?.allDay?.value, defaultSettings.schedule.allDay),
        start: this.toHoursMinutesString(old.activeTimes?.value?.start?.value, defaultSettings.schedule.start),
        end: this.toHoursMinutesString(old.activeTimes?.value?.end?.value, defaultSettings.schedule.end),
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
      await chrome.storage.sync.clear();
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
