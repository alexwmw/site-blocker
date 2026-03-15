import type { Schedule } from '../types/schema';
import type { DayOfWeek } from '../types/schema';

export class SchedulingService {
  private static timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private static isDayActive(schedule: Schedule, day: DayOfWeek): boolean {
    if (!schedule.enabled) {
      return false;
    }
    return schedule.activeDays[day];
  }

  private static isTimeActive(schedule: Schedule, now: Date = new Date()): boolean {
    if (!schedule.enabled) {
      return false;
    }
    if (schedule.allDay) {
      return true;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const start = this.timeToMinutes(schedule.start);
    const end = this.timeToMinutes(schedule.end);

    // Normal range: 09:00 → 17:00
    if (start <= end) {
      return currentMinutes >= start && currentMinutes < end;
    }

    // Overnight range: 22:00 → 06:00
    return currentMinutes >= start || currentMinutes < end;
  }

  /** Fix Sunday-indexed day integer */
  static getDayOfWeek(day: number | Date = new Date()): DayOfWeek {
    const n = typeof day === 'number' ? day : day.getDay();
    return (n + 6) % 7;
  }

  static isScheduleActiveNow(schedule: Schedule, now: Date = new Date()): boolean {
    if (!schedule.enabled) {
      return false;
    }

    const day: DayOfWeek = this.getDayOfWeek(now);
    if (schedule.allDay) {
      return this.isDayActive(schedule, day);
    }

    if (!this.isTimeActive(schedule, now)) {
      return false;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const start = this.timeToMinutes(schedule.start);
    const end = this.timeToMinutes(schedule.end);

    // Same-day range: use current day settings.
    if (start <= end) {
      return this.isDayActive(schedule, day);
    }

    // Overnight range: after midnight uses previous day's schedule window.
    if (currentMinutes >= start) {
      return this.isDayActive(schedule, day);
    }
    const previousDay = ((day + 6) % 7) as DayOfWeek;
    return this.isDayActive(schedule, previousDay);
  }

  static isBlockingActiveNow(schedule: Schedule | undefined, now: Date = new Date()): boolean {
    if (schedule && schedule.enabled) {
      return this.isScheduleActiveNow(schedule, now);
    }
    return true;
  }
}
