import { z } from 'zod';

/** 24-hour time in `HH:mm` format. */
export const TIME_REGEX = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

/** Supported UI themes. */
export const THEMES = ['mindful-light', 'mindful-dark', 'focus-light', 'focus-dark'] as const;

/** User-selected UI theme. */
export const themeSchema = z.enum(THEMES);

export type Theme = z.infer<typeof themeSchema>;

/**
 * Day-of-week index used throughout the scheduling system.
 *
 * Monday starts at `0` so indices align with the `scheduleDaysSchema` tuple.
 */
export enum DayOfWeek {
  Monday = 0,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
}

/**
 * A fixed Monday-to-Sunday tuple describing which days scheduled blocking
 * should apply on.
 */
export const scheduleDaysSchema = z.tuple([
  z.boolean(), // Monday
  z.boolean(), // Tuesday
  z.boolean(), // Wednesday
  z.boolean(), // Thursday
  z.boolean(), // Friday
  z.boolean(), // Saturday
  z.boolean(), // Sunday
]);

export type ScheduleDays = z.infer<typeof scheduleDaysSchema>;

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const scheduleWindowSchema = z
  .object({
    /** Unique identifier for the rule. */
    id: z.string().readonly(),
    /** Weekday booleans */
    days: scheduleDaysSchema,
    /** Start time in 24-hour `HH:mm` format. */
    start: z.string().regex(TIME_REGEX),
    /** End time in 24-hour `HH:mm` format. */
    end: z.string().regex(TIME_REGEX),
  })
  .superRefine((data, ctx) => {
    if (!data.days.some(Boolean)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['days'],
        message: 'Select at least one day for this schedule window.',
      });
    }

    if (timeToMinutes(data.end) <= timeToMinutes(data.start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end'],
        message: 'End time must be later than the start time.',
      });
    }
  });

export type ScheduleWindow = z.infer<typeof scheduleWindowSchema>;

/**
 * Scheduled blocking configuration.
 *
 * When `enabled` is `true`, blocking only applies on selected days and within
 * the configured time range.
 */
export const scheduleSchema = z
  .object({
    /** Whether scheduled blocking is enabled. */
    enabled: z.boolean(),
    windows: z.array(scheduleWindowSchema),
  })
  .superRefine((data, ctx) => {
    if (data.windows.length > 0 && data.windows[0]?.id !== '_initial') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['windows', 0, 'id'],
        message: "Initial window must have the id '_initial'",
      });
    }

    for (const [index, window] of data.windows.entries()) {
      for (const [compareIndex, compareWindow] of data.windows.entries()) {
        if (compareIndex <= index) {
          continue;
        }

        const sameRange = window.start === compareWindow.start && window.end === compareWindow.end;
        const sameDays = window.days.every((dayEnabled, dayIndex) => dayEnabled === compareWindow.days[dayIndex]);
        if (sameRange && sameDays) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['windows', compareIndex, 'days'],
            message: 'Duplicate recurring schedule rule. Adjust the days or time range.',
          });
        }

        const overlapsOnAnyDay = window.days.some((dayEnabled, dayIndex) => {
          if (!dayEnabled || !compareWindow.days[dayIndex]) {
            return false;
          }

          return (
            timeToMinutes(window.start) < timeToMinutes(compareWindow.end) &&
            timeToMinutes(compareWindow.start) < timeToMinutes(window.end)
          );
        });

        if (overlapsOnAnyDay) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['windows', compareIndex, 'days'],
            message: `This schedule window overlaps with ${window.start}–${window.end} on one or more selected days.`,
          });
        }
      }
    }
  });

/**
 * User-configurable extension settings.
 */
export const settingsSchema = z.object({
  /** UI theme preference. */
  theme: themeSchema,

  /** Number of seconds the unblock button must be held. */
  holdDurationSeconds: z.number().min(3).max(99),

  /** Whether the user has rated or reviewed the extension. */
  isRated: z.boolean(),

  /** Scheduled blocking configuration. */
  schedule: scheduleSchema,

  /** H1 on the block page */
  blockPageHeadline: z.string(),

  /**
   * Extended unblock behaviour allowing a site to remain unblocked
   * for a limited time after a successful unblock.
   */
  extendedUnblock: z.object({
    /** Whether temporary extended unblocking is enabled. */
    enabled: z.boolean(),

    /** How long a site remains unblocked, in minutes. */
    durationMinutes: z.number(),
  }),
});

export type Settings = z.infer<typeof settingsSchema>;
export type Schedule = z.infer<typeof scheduleSchema>;

/** Supported URL matching strategies for block rules. */
export const MATCH_TYPES = ['exact', 'prefix'] as const;

/** Match strategy used when comparing a URL against a rule pattern. */
export const matchTypeSchema = z.enum(MATCH_TYPES);

export type MatchType = z.infer<typeof matchTypeSchema>;

/**
 * A single blocking rule.
 */
export const blockRuleSchema = z.object({
  /** Unique identifier for the rule. */
  id: z.string().readonly(),

  /** URL, hostname, or path pattern to match against. */
  pattern: z.string(),

  /** Whether the pattern must match exactly or by prefix. */
  matchType: matchTypeSchema,

  /** ISO-8601 timestamp representing when the rule was created. */
  createdAt: z.string().datetime(), // Validates ISO string,

  /** Whether the rule is currently active. */
  enabled: z.boolean(),

  /**
   * Unix timestamp in milliseconds until which the rule is temporarily unblocked.
   * Omitted when the rule is currently blocked as normal.
   */
  unblockUntil: z.number().optional(),
});

/** Collection of blocking rules stored by the extension. */
export const blockRulesSchema = z.array(blockRuleSchema);

export type BlockRule = z.infer<typeof blockRuleSchema>;

/**
 * Top-level persisted storage schema for the extension.
 */
export const storageSchema = z.object({
  /** Schema version used for storage migrations. */
  version: z.number(),

  /** Persisted user settings. */
  settings: settingsSchema,

  /** Persisted block rules. */
  rules: blockRulesSchema,
});

export type StorageSchema = z.infer<typeof storageSchema>;
