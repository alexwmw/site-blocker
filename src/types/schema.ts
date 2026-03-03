import { z } from 'zod';

export const THEMES = ['light', 'dark'] as const;

export const ThemeSchema = z.enum(THEMES);

export type Theme = z.infer<typeof ThemeSchema>;

export enum DayOfWeek {
  Monday = 0,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
}

export const ActiveDaysSchema = z.tuple([
  z.boolean(), // Mon
  z.boolean(), // Tue
  z.boolean(), // Wed
  z.boolean(), // Thu
  z.boolean(), // Fri
  z.boolean(), // Sat
  z.boolean(), // Sun
]);

export type ActiveDays = z.infer<typeof ActiveDaysSchema>;

export const ScheduleSchema = z.object({
  enabled: z.boolean(),
  activeDays: ActiveDaysSchema,
  allDay: z.boolean(),
  start: z.string().regex(/^[0-2][0-9]:[0-5][0-9]$/),
  end: z.string().regex(/^[0-2][0-9]:[0-5][0-9]$/),
});

export const SettingsSchema = z.object({
  theme: ThemeSchema,
  holdDurationSeconds: z.number().min(3).max(99),
  isRated: z.boolean(),
  schedule: ScheduleSchema,
  revisit: z.object({
    enabled: z.boolean(),
    durationMinutes: z.number(),
  }),
});

export type Settings = z.infer<typeof SettingsSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;

export const MATCH_TYPES = ['domain', 'path'] as const;

export const MatchTypeSchema = z.enum(MATCH_TYPES);

export type MatchType = z.infer<typeof MatchTypeSchema>;

export const BlockRuleSchema = z.object({
  id: z.string(),
  pattern: z.string(),
  matchType: MatchTypeSchema,
  createdAt: z.string().datetime(), // Validates ISO string,
  enabled: z.boolean(),
  unblockUntil: z.number().optional(),
});

export const BlockRulesSchema = z.array(BlockRuleSchema);

export type BlockRule = z.infer<typeof BlockRuleSchema>;

export interface StorageSchema {
  version: 3;
  settings: Settings;
  rules: BlockRule[];
}
