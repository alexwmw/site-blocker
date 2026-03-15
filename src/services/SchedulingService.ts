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

  private static isScheduleActiveToday(schedule: Schedule, day: DayOfWeek): boolean {
    if (!schedule.enabled) {
      return false;
    }
    return schedule.windows.some((w) => w.days[day]);
  }

  private static isWindowActiveAtThisTime(window: ScheduleWindow, now: Date) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const start = this.timeToMinutes(window.start);
    const end = this.timeToMinutes(window.end);

    // Normal range: 09:00 → 17:00
    if (start <= end) {
      return currentMinutes >= start && currentMinutes < end;
    }

    // Overnight range: 22:00 → 06:00 - should be disabled by the UI.
    // Warn and return anyway.
    console.warn('A window with an impossible range was found.', window);
    return false;
  }

  private static isScheduleActiveAtThisTime(schedule: Schedule, now: Date): boolean {
    if (!schedule.enabled) {
      return false;
    }
    return schedule.windows.some((w) => this.isWindowActiveAtThisTime(w, now));
  }

  static isScheduleActiveNow(schedule: Schedule, now: Date = new Date()): boolean {
    if (!schedule.enabled) {
      return false;
    }
    if (schedule.windows.length === 0) {
      return false;
    }
    const day: DayOfWeek = this.getDayOfWeek(now);
    const isActiveToday = this.isScheduleActiveToday(schedule, day);
    const isActiveAtThisTime = this.isScheduleActiveNow(schedule, now);

    return isActiveToday && isActiveAtThisTime;
  }

  static isBlockingActiveNow(schedule: Schedule | undefined, now: Date = new Date()): boolean {
    if (schedule && schedule.enabled) {
      return this.isScheduleActiveNow(schedule, now);
    }
    return true;
  }
}
