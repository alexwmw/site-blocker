import type { DayOfWeek, Schedule, ScheduleWindow } from '@/types/schema';
import { scheduleSchema } from '@/types/schema';

export type ScheduleValidationCode = 'invalid_range' | 'no_days' | 'overlap' | 'duplicate';

export type ScheduleValidationIssue = {
  code: ScheduleValidationCode;
  message: string;
  path: Array<string | number>;
  windowId?: string;
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
        if (issue.message.includes('Duplicate')) {
          return 'duplicate';
        }
        if (issue.message.includes('overlaps')) {
          return 'overlap';
        }
        if (issue.message.includes('Select at least one day')) {
          return 'no_days';
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

  static getWindowValidationMessages(schedule: Schedule, windowId: string): string[] {
    return this.getValidationIssues(schedule)
      .filter((issue) => issue.windowId === windowId)
      .map((issue) => issue.message);
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
