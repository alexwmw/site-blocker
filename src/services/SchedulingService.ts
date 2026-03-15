import type { DayOfWeek, Schedule, ScheduleWindow } from '../types/schema';

export class SchedulingService {
  static getDayOfWeek(day: number | Date = new Date()): DayOfWeek {
    const n = typeof day === 'number' ? day : day.getDay();
    return (n + 6) % 7;
  }

  private static timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private static getCurrentDayAndMinutes(
    schedule: Schedule,
    now: Date,
  ): {
    day: DayOfWeek;
    minutes: number;
  } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: schedule.timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const weekdayPart = parts.find((part) => part.type === 'weekday')?.value;
    const hourPart = parts.find((part) => part.type === 'hour')?.value;
    const minutePart = parts.find((part) => part.type === 'minute')?.value;

    const weekdayMap: Record<string, DayOfWeek> = {
      Mon: 0,
      Tue: 1,
      Wed: 2,
      Thu: 3,
      Fri: 4,
      Sat: 5,
      Sun: 6,
    };

    const day = weekdayPart ? weekdayMap[weekdayPart] : undefined;
    const hours = Number(hourPart);
    const minutes = Number(minutePart);

    if (day === undefined || Number.isNaN(hours) || Number.isNaN(minutes)) {
      return {
        day: this.getDayOfWeek(now),
        minutes: now.getHours() * 60 + now.getMinutes(),
      };
    }

    return {
      day,
      minutes: hours * 60 + minutes,
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
    if (!schedule.enabled || schedule.windows.length === 0) {
      return false;
    }

    const { day, minutes } = this.getCurrentDayAndMinutes(schedule, now);

    return schedule.windows.some((window) => window.days[day] && this.isWindowActiveAtThisTime(window, minutes));
  }

  static isBlockingActiveNow(schedule: Schedule | undefined, now: Date = new Date()): boolean {
    if (schedule && schedule.enabled) {
      return this.isScheduleActiveNow(schedule, now);
    }
    return true;
  }
}
