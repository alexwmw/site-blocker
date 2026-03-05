import { z } from 'zod';

export const TIME_REGEX = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export const THEMES = ['light', 'dark'] as const;

export const themeSchema = z.enum(THEMES);

export type Theme = z.infer<typeof themeSchema>;

export enum DayOfWeek {
  Monday = 0,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
}

export const activeDaysSchema = z.tuple([
  z.boolean(), // Mon
  z.boolean(), // Tue
  z.boolean(), // Wed
  z.boolean(), // Thu
  z.boolean(), // Fri
  z.boolean(), // Sat
  z.boolean(), // Sun
]);

export type ActiveDays = z.infer<typeof activeDaysSchema>;

export const scheduleSchema = z.object({
  enabled: z.boolean(),
  activeDays: activeDaysSchema,
  allDay: z.boolean(),
  start: z.string().regex(TIME_REGEX),
  end: z.string().regex(TIME_REGEX),
});

export const settingsSchema = z.object({
  theme: themeSchema,
  holdDurationSeconds: z.number().min(3).max(99),
  isRated: z.boolean(),
  schedule: scheduleSchema,
  revisit: z.object({
    enabled: z.boolean(),
    durationMinutes: z.number(),
  }),
});

export type Settings = z.infer<typeof settingsSchema>;
export type Schedule = z.infer<typeof scheduleSchema>;

export const MATCH_TYPES = ['domain', 'path'] as const;

export const matchTypeSchema = z.enum(MATCH_TYPES);

export type MatchType = z.infer<typeof matchTypeSchema>;

export const blockRuleSchema = z.object({
  id: z.string(),
  pattern: z.string(),
  matchType: matchTypeSchema,
  createdAt: z.string().datetime(), // Validates ISO string,
  enabled: z.boolean(),
  unblockUntil: z.number().optional(),
});

export const blockRulesSchema = z.array(blockRuleSchema);

export type BlockRule = z.infer<typeof blockRuleSchema>;

export const storageSchema = z.object({
  version: z.number(),
  settings: settingsSchema,
  rules: blockRulesSchema,
});

export type StorageSchema = z.infer<typeof storageSchema>;
