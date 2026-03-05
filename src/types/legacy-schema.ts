export type LegacyOptions = {
  theme?: { value?: string };
  activeDays?: {
    value?: Array<{ label?: string; value?: boolean | string }>;
  };
  activeTimes?: {
    value?: {
      allDay?: { value?: boolean | string };
      end?: { value?: string };
      start?: { value?: string };
    };
  };
  isRated?: { value?: boolean | string };
  allowRevisits?: { value?: boolean | string };
  revisitLimit?: { value?: number | string };
  unblockTimeout?: { value?: number | string };
  scheduleBlocking?: { value?: boolean | string };
};

export type LegacyProvider = {
  id?: string;
  hostname?: string;
  isByPath?: boolean | string;
  dateAdded?: string;
  unblocked?: boolean | string;
  lastUnblock?: string;
};
