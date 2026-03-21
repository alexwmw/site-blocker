import { describe, expect, it } from 'vitest';

import type { Schedule } from './schema';
import { popularSiteSchema, settingsSchema } from './schema';

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

  it('should reject blank block page headlines', () => {
    const result = settingsSchema.safeParse({
      theme: 'mindful-light',
      holdDurationSeconds: 15,
      isRated: false,
      schedule: {
        enabled: false,
        windows: [{ id: '_initial', days: [true, true, true, true, true, false, false], start: '09:00', end: '17:00' }],
      },
      blockPageHeadline: '   ',
      extendedUnblock: {
        enabled: true,
        durationMinutes: 10,
      },
    });

    expect(result.success).toBe(false);
  });

  it('should reject extended unblock durations outside the supported range', () => {
    const result = settingsSchema.safeParse({
      theme: 'mindful-light',
      holdDurationSeconds: 15,
      isRated: false,
      schedule: {
        enabled: false,
        windows: [{ id: '_initial', days: [true, true, true, true, true, false, false], start: '09:00', end: '17:00' }],
      },
      blockPageHeadline: 'Stay on track',
      extendedUnblock: {
        enabled: true,
        durationMinutes: 0,
      },
    });

    expect(result.success).toBe(false);
  });
  it('should validate the shared popular-site contract for onboarding-ready entries', () => {
    const result = popularSiteSchema.safeParse({
      id: 'youtube',
      category: 'video',
      displayName: 'YouTube',
      domainPatterns: ['youtube.com', 'youtu.be'],
      icon: 'play',
    });

    expect(result.success).toBe(true);
  });

  it('should reject curated popular-site entries without domain patterns', () => {
    const result = popularSiteSchema.safeParse({
      id: 'youtube',
      category: 'video',
      displayName: 'YouTube',
      domainPatterns: [],
      icon: 'play',
    });

    expect(result.success).toBe(false);
  });

});
