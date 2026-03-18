import { describe, expect, it } from 'vitest';

import { SchedulingService } from './SchedulingService';

import type { Schedule } from '@/types/schema';

const buildSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  enabled: true,
  windows: [
    {
      id: '_initial',
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

  it('reports duplicate, overlap, and no-day validation issues', () => {
    const schedule = buildSchedule({
      windows: [
        {
          id: '_initial',
          days: [true, false, false, false, false, false, false],
          start: '09:00',
          end: '11:00',
        },
        {
          id: 'duplicate',
          days: [true, false, false, false, false, false, false],
          start: '09:00',
          end: '11:00',
        },
        {
          id: 'empty-days',
          days: [false, false, false, false, false, false, false],
          start: '12:00',
          end: '13:00',
        },
      ],
    });

    const messages = SchedulingService.getValidationIssues(schedule).map((issue) => issue.message);

    expect(messages).toContain('Duplicate recurring schedule rule. Adjust the days or time range.');
    expect(messages.some((message) => message.includes('overlaps with 09:00–11:00'))).toBe(true);
    expect(messages).toContain('Select at least one day for this schedule window.');
  });

  it('treats invalid schedules as inactive until conflicts are resolved', () => {
    const schedule = buildSchedule({
      windows: [
        {
          id: '_initial',
          days: [true, false, false, false, false, false, false],
          start: '09:00',
          end: '11:00',
        },
        {
          id: 'overlap',
          days: [true, false, false, false, false, false, false],
          start: '10:30',
          end: '11:30',
        },
      ],
    });

    expect(SchedulingService.isScheduleActiveNow(schedule, new Date('2026-01-05T10:45:00.000Z'))).toBe(false);
  });
});
