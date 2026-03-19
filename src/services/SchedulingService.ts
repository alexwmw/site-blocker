import type { DayOfWeek, Schedule, ScheduleWindow } from '@/types/schema';

export class SchedulingService {
  static getDayOfWeek(day: number | Date = new Date()): DayOfWeek {
    const n = typeof day === 'number' ? day : day.getDay();
    return (n + 6) % 7;
  }

  static timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
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
    if (!schedule.enabled || schedule.windows.length === 0) {
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
