import { describe, expect, it } from 'vitest';

import type { Schedule } from '../types/schema';

import { SchedulingService } from './SchedulingService';

const buildSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  enabled: true,
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
  it('returns true when current time is inside an enabled window', () => {
    const schedule = buildSchedule();

    const now = new Date('2026-01-05T10:30:00.000Z');

    expect(SchedulingService.isScheduleActiveNow(schedule, now)).toBe(true);
  });

  it('returns false when current time is outside the active window', () => {
    const schedule = buildSchedule();

    const now = new Date('2026-01-05T14:30:00.000Z');

    expect(SchedulingService.isScheduleActiveNow(schedule, now)).toBe(false);
  });

  it('treats disabled schedules as not active and blocking as always active', () => {
    const schedule = buildSchedule({ enabled: false });

    expect(SchedulingService.isScheduleActiveNow(schedule)).toBe(false);
    expect(SchedulingService.isBlockingActiveNow(schedule)).toBe(true);
  });
});
