import { describe, expect, it } from 'vitest';

import type { Schedule } from './schema';
import { settingsSchema } from './schema';

describe('Schema Validation', () => {
  it('should accept valid military time', () => {
    const schedule: Schedule = {
      enabled: true,
      windows: [{ id: '_initial', days: [true, true, true, true, true, true, true], start: '09:00', end: '17:30' }],
    };
    const result = settingsSchema.shape.schedule.safeParse(schedule);
    expect(result.success).toBe(true);
  });

  it('should reject invalid time formats', () => {
    const schedule: Schedule = {
      enabled: true,
      windows: [
        {
          id: '_initial',
          days: [true, true, true, true, true, true, true],
          start: '9:00 AM',
          end: '25:00',
        },
      ],
    };
    const result = settingsSchema.shape.schedule.safeParse(schedule);
    expect(result.success).toBe(false);
  });

  it('should enforce exactly 7 days in a window', () => {
    const schedule: Schedule = {
      enabled: true,
      windows: [
        {
          id: '_initial',
          // @ts-expect-error
          days: [true, true],
          start: '09:00',
          end: '17:30',
        },
      ],
    };
    const result = settingsSchema.shape.schedule.safeParse(schedule);
    expect(result.success).toBe(false);
  });

  it('should enforce end times always be later than start times', () => {
    const schedule: Schedule = {
      enabled: true,
      windows: [{ id: '_initial', days: [true, true, true, true, true, true, true], start: '19:00', end: '07:30' }],
    };
    const result = settingsSchema.shape.schedule.safeParse(schedule);
    expect(result.success).toBe(false);
  });

  it('should allow windows with no selected days', () => {
    const schedule: Schedule = {
      enabled: true,
      windows: [
        { id: '_initial', days: [false, false, false, false, false, false, false], start: '09:00', end: '17:30' },
      ],
    };

    const result = settingsSchema.shape.schedule.safeParse(schedule);

    expect(result.success).toBe(true);
  });

  it('should allow overlapping windows because blocking still works', () => {
    const schedule: Schedule = {
      enabled: true,
      windows: [
        { id: '_initial', days: [true, false, false, false, false, false, false], start: '09:00', end: '12:00' },
        { id: 'window-2', days: [true, false, false, false, false, false, false], start: '09:00', end: '12:00' },
      ],
    };

    const result = settingsSchema.shape.schedule.safeParse(schedule);

    expect(result.success).toBe(true);
  });
});
