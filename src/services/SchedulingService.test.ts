import { describe, expect, it } from 'vitest';

import type { Schedule } from '../types/schema';

import { SchedulingService } from './SchedulingService';

const buildSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  enabled: true,
  timezone: 'UTC',
  windows: [
    {
      days: [true, true, true, true, true, true, true],
      start: '10:00',
      end: '11:00',
    },
  ],
  ...overrides,
});

describe('SchedulingService', () => {
  it('returns true when current timezone-adjusted time is inside an enabled window', () => {
    const schedule = buildSchedule({ timezone: 'America/New_York' });

    // Monday 10:30 in New York (UTC-5)
    const now = new Date('2026-01-05T15:30:00.000Z');

    expect(SchedulingService.isScheduleActiveNow(schedule, now)).toBe(true);
  });

  it('returns false when current timezone-adjusted time is outside the active window', () => {
    const schedule = buildSchedule({ timezone: 'America/New_York' });

    // Monday 09:30 in New York
    const now = new Date('2026-01-05T14:30:00.000Z');

    expect(SchedulingService.isScheduleActiveNow(schedule, now)).toBe(false);
  });

  it('treats disabled schedules as not active and blocking as always active', () => {
    const schedule = buildSchedule({ enabled: false });

    expect(SchedulingService.isScheduleActiveNow(schedule)).toBe(false);
    expect(SchedulingService.isBlockingActiveNow(schedule)).toBe(true);
  });
});
