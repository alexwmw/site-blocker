export type Theme = 'light' | 'dark';

export enum DayOfWeek {
  Monday = 0,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
}

export type DayBooleans = [
  Monday: boolean,
  Tuesday: boolean,
  Wednesday: boolean,
  Thursday: boolean,
  Friday: boolean,
  Saturday: boolean,
  Sunday: boolean,
];

export type Schedule = {
  enabled: boolean;
  activeDays: DayBooleans;
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
  createdAt: number;
  enabled: boolean;
  unblockUntil?: number;
};
