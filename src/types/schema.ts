export const THEMES = ['light', 'dark'] as const;

export type Theme = (typeof THEMES)[number];

export type ActiveDays = [boolean, boolean, boolean, boolean, boolean, boolean, boolean];

export enum DayOfWeek {
  Monday = 0,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
}

export type Schedule = {
  enabled: boolean;
  activeDays: ActiveDays;
  allDay: boolean;
  start: string; // "09:00"
  end: string; // "17:00"
};

export type RevisitConfig = {
  enabled: boolean;
  durationMinutes: number;
};

export type Settings = {
  theme: Theme;
  holdDurationSeconds: number;
  schedule: Schedule;
  revisit: RevisitConfig;
  isRated: boolean;
};

export type BlockRule = {
  id: string;
  pattern: string;
  matchType: 'domain' | 'path';
  createdAt: string;
  enabled: boolean;
  unblockUntil?: number;
};

export interface StorageSchema {
  version: 3;
  settings: Settings;
  rules: BlockRule[];
}
