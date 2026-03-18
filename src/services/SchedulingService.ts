import type { DayOfWeek, Schedule, ScheduleWindow } from '@/types/schema';
import { scheduleSchema } from '@/types/schema';

export type ScheduleValidationCode = 'invalid_range' | 'no_days' | 'invalid_initial_window';

export type ScheduleValidationIssue = {
  code: ScheduleValidationCode;
  message: string;
  path: Array<string | number>;
  windowId?: string;
};

export type ScheduleWarningCode = 'overlap' | 'duplicate';

export type ScheduleWarning = {
  code: ScheduleWarningCode;
  message: string;
  windowIds: string[];
};

export class SchedulingService {
  static getDayOfWeek(day: number | Date = new Date()): DayOfWeek {
    const n = typeof day === 'number' ? day : day.getDay();
    return (n + 6) % 7;
  }

  static timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  static minutesToTime(minutes: number): string {
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mins = String(minutes % 60).padStart(2, '0');
    return `${hours}:${mins}`;
  }

  static formatTimezoneLabel(date: Date = new Date()): string {
    const { timeZone = 'UTC' } = Intl.DateTimeFormat().resolvedOptions();
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absoluteMinutes = Math.abs(offsetMinutes);
    const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, '0');
    const minutes = String(absoluteMinutes % 60).padStart(2, '0');
    return `${timeZone} (UTC${sign}${hours}:${minutes})`;
  }

  static getValidationIssues(schedule: Schedule): ScheduleValidationIssue[] {
    const parsed = scheduleSchema.safeParse(schedule);
    if (parsed.success) {
      return [];
    }

    return parsed.error.issues.map((issue) => {
      const path = [...issue.path];
      const maybeWindowIndex = path[1];
      const windowId = typeof maybeWindowIndex === 'number' ? schedule.windows[maybeWindowIndex]?.id : undefined;
      const code = (() => {
        if (issue.message.includes('Select at least one day')) {
          return 'no_days';
        }
        if (issue.message.includes('Initial window must')) {
          return 'invalid_initial_window';
        }
        return 'invalid_range';
      })();

      return {
        code,
        message: issue.message,
        path,
        windowId,
      } satisfies ScheduleValidationIssue;
    });
  }

  static getWarnings(schedule: Schedule): ScheduleWarning[] {
    const warnings: ScheduleWarning[] = [];

    for (const [index, window] of schedule.windows.entries()) {
      for (const [compareIndex, compareWindow] of schedule.windows.entries()) {
        if (compareIndex <= index) {
          continue;
        }

        const sharedDays = window.days
          .map((dayEnabled, dayIndex) => (dayEnabled && compareWindow.days[dayIndex] ? dayIndex : -1))
          .filter((dayIndex) => dayIndex >= 0);

        if (sharedDays.length === 0) {
          continue;
        }

        const sameRange = window.start === compareWindow.start && window.end === compareWindow.end;
        const overlaps =
          this.timeToMinutes(window.start) < this.timeToMinutes(compareWindow.end) &&
          this.timeToMinutes(compareWindow.start) < this.timeToMinutes(window.end);

        if (!overlaps) {
          continue;
        }

        warnings.push({
          code: sameRange ? 'duplicate' : 'overlap',
          windowIds: [window.id, compareWindow.id],
          message: sameRange
            ? `Windows ${index + 1} and ${compareIndex + 1} are identical. Keeping both is harmless, but one could be removed.`
            : `Windows ${index + 1} and ${compareIndex + 1} overlap. Blocking will still work, but you may want to combine them.`,
        });
      }
    }

    return warnings;
  }

  static getWindowWarningMessages(schedule: Schedule, windowId: string): string[] {
    return this.getWarnings(schedule)
      .filter((warning) => warning.windowIds.includes(windowId))
      .map((warning) => warning.message);
  }

  private static getCurrentDayAndMinutes(now: Date): {
    day: DayOfWeek;
    minutes: number;
  } {
    return {
      day: this.getDayOfWeek(now),
      minutes: now.getHours() * 60 + now.getMinutes(),
    };
  }

  private static isWindowActiveAtThisTime(window: ScheduleWindow, currentMinutes: number) {
    const start = this.timeToMinutes(window.start);
    const end = this.timeToMinutes(window.end);

    if (start <= end) {
      return currentMinutes >= start && currentMinutes < end;
    }

    console.warn('A window with an impossible range was found.', window);
    return false;
  }

  static isScheduleActiveNow(schedule: Schedule, now: Date = new Date()): boolean {
    if (!schedule.enabled || schedule.windows.length === 0 || this.getValidationIssues(schedule).length > 0) {
      return false;
    }

    const { day, minutes } = this.getCurrentDayAndMinutes(now);

    return schedule.windows.some((window) => window.days[day] && this.isWindowActiveAtThisTime(window, minutes));
  }

  static isBlockingActiveNow(schedule: Schedule | undefined, now: Date = new Date()): boolean {
    if (schedule && schedule.enabled) {
      return this.isScheduleActiveNow(schedule, now);
    }
    return true;
  }
}
