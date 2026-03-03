import { describe, expect, it } from 'vitest';

import { SettingsSchema } from './schema';

describe('Schema Validation', () => {
  it('should accept valid military time', () => {
    const result = SettingsSchema.shape.schedule.safeParse({
      enabled: true,
      activeDays: [true, true, true, true, true, true, true],
      allDay: false,
      start: '09:00',
      end: '17:30',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid time formats', () => {
    const result = SettingsSchema.shape.schedule.safeParse({
      start: '9:00 AM', // Wrong format
      end: '25:00', // Impossible hour
    });
    expect(result.success).toBe(false);
  });

  it('should enforce exactly 7 days in activeDays', () => {
    const result = SettingsSchema.shape.schedule.safeParse({
      activeDays: [true, true], // Too short
    });
    expect(result.success).toBe(false);
  });
});
