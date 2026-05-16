import { SchedulingService } from '@/services/SchedulingService';
import type { Schedule } from '@/types/schema';
import { DayOfWeek } from '@/types/schema';

export type DayName = keyof typeof DayOfWeek | 'today' | 'tomorrow';

const getDayString = (nextChange: Date, currentDate: Date = new Date()): DayName => {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const MS_PER_DAY = 86_400_000;
  const diffDays = Math.round((startOfDay(nextChange) - startOfDay(currentDate)) / MS_PER_DAY);
  if (diffDays === 1) {
    return 'tomorrow';
  }
  if (diffDays === 0) {
    return 'today';
  }
  const index = (nextChange.getDay() + 6) % 7;
  return DayOfWeek[index] as DayName;
};

const getTimeString = (nextChange: Date) =>
  nextChange.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

export const getNextChangeString = (schedule: Schedule | undefined, isBlockingActiveNow: boolean): string | null => {
  if (!schedule || !schedule.enabled) {
    return null;
  }
  const nextChangeTime = SchedulingService.getNextChangeTime(schedule);
  if (!nextChangeTime) {
    return 'Schedule enabled but no schedule is set';
  }
  const time = getTimeString(nextChangeTime);
  const day = getDayString(nextChangeTime);
  const transitions = isBlockingActiveNow ? 'ends' : 'starts';
  if (day === 'tomorrow' && time === '12:00 am') {
    return `Schedule ${transitions}: at midnight`;
  }
  return `Schedule ${transitions}: ${day} ${time}`;
};
