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

  private static getChangeCandidates(schedule: Schedule, now: Date): number[] {
    const nowTs = now.getTime();
    const { day } = this.getCurrentDayAndMinutes(now);
    const candidates = new Set<number>();

    for (const window of schedule.windows) {
      if (window.days.every((d) => !d)) {
        continue;
      }

      const startMin = this.timeToMinutes(window.start);
      const endMin = this.timeToMinutes(window.end);

      // Check today through the same weekday next week.
      // Including i=7 prevents missing weekly windows when today's window already ended.
      for (let i = 0; i <= 7; i++) {
        const checkDay = (day + i) % 7;

        if (!window.days[checkDay]) {
          continue;
        }

        const baseDate = new Date(now);
        baseDate.setDate(now.getDate() + i);

        const startDate = new Date(baseDate);
        startDate.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
        if (startDate.getTime() > nowTs) {
          candidates.add(startDate.getTime());
        }

        const endDate = new Date(baseDate);
        endDate.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
        if (endDate.getTime() > nowTs) {
          candidates.add(endDate.getTime());
        }
      }
    }

    return Array.from(candidates).sort((a, b) => a - b);
  }

  static getNextChangeTime(schedule: Schedule, now: Date = new Date()): Date | null {
    const activeNow = this.isScheduleActiveNow(schedule, now);
    const candidates = this.getChangeCandidates(schedule, now);

    for (const candidateTs of candidates) {
      const candidateState = this.isScheduleActiveNow(schedule, new Date(candidateTs));
      if (candidateState !== activeNow) {
        return new Date(candidateTs);
      }
    }

    return null;
  }
}
