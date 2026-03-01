import type { DayOfWeek, Schedule } from './schema';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function isDayActive(schedule: Schedule, day: DayOfWeek): boolean {
  if (!schedule.enabled) {
    return false;
  }
  return schedule.activeDays[day];
}

function isTimeActive(schedule: Schedule, now: Date = new Date()): boolean {
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

function isScheduleActiveNow(schedule: Schedule, now: Date = new Date()): boolean {
  const day = now.getDay() as DayOfWeek;

  return schedule.enabled && isDayActive(schedule, day) && isTimeActive(schedule, now);
}

export const ScheduleUtils = {
  isDayActive,
  isTimeActive,
  isScheduleActiveNow,
};
