import type { DayOfWeek, Schedule, Theme } from './schema';
import { THEMES } from './schema';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function isDayActive(schedule: Schedule, day: DayOfWeek): boolean {
  if (!schedule.enabled) {
    return false;
  }
  return schedule.activeDays[day];
}

export function isTimeActive(schedule: Schedule, now: Date = new Date()): boolean {
  if (!schedule.enabled) {
    return false;
  }
  if (schedule.allDay) {
    return true;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const start = timeToMinutes(schedule.start);
  const end = timeToMinutes(schedule.end);

  // Normal range: 09:00 → 17:00
  if (start <= end) {
    return currentMinutes >= start && currentMinutes < end;
  }

  // Overnight range: 22:00 → 06:00
  return currentMinutes >= start || currentMinutes < end;
}

export function isScheduleActiveNow(schedule: Schedule, now: Date = new Date()): boolean {
  const day = now.getDay() as DayOfWeek;

  return schedule.enabled && isDayActive(schedule, day) && isTimeActive(schedule, now);
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && THEMES.includes(value as Theme);
}

export function deepMerge<T>(target: T, source: any): T {
  const output = { ...target };
  if (target && typeof target === 'object' && source && typeof source === 'object') {
    Object.keys(source).forEach((key) => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        // @ts-ignore
        output[key] = deepMerge(target[key], source[key]);
      } else {
        // @ts-ignore
        output[key] = source[key];
      }
    });
  }
  return output;
}
