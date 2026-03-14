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

/** Fix Sunday-indexed day integer */
function getDayOfWeek(day: number | Date): DayOfWeek {
  const n = typeof day === 'number' ? day : day.getDay();
  return (n + 6) % 7;
}

export function isScheduleActiveNow(schedule: Schedule, now: Date = new Date()): boolean {
  if (!schedule.enabled) {
    return false;
  }

  const day: DayOfWeek = getDayOfWeek(now);
  if (schedule.allDay) {
    return isDayActive(schedule, day);
  }

  if (!isTimeActive(schedule, now)) {
    return false;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(schedule.start);
  const end = timeToMinutes(schedule.end);

  // Same-day range: use current day settings.
  if (start <= end) {
    return isDayActive(schedule, day);
  }

  // Overnight range: after midnight uses previous day's schedule window.
  if (currentMinutes >= start) {
    return isDayActive(schedule, day);
  }
  const previousDay = ((day + 6) % 7) as DayOfWeek;
  return isDayActive(schedule, previousDay);
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}
