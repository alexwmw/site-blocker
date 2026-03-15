import type { Settings } from '../types/schema';

const defaultSettings: Settings = {
  theme: 'light',
  holdDurationSeconds: 15,
  schedule: {
    enabled: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    windows: [
      {
        days: [true, true, true, true, true, false, false],
        start: '09:00',
        end: '16:59',
      },
    ],
  },
  extendedUnblock: {
    enabled: true,
    durationMinutes: 10,
  },
  isRated: false,
};

export const resolveRuntimeTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || defaultSettings.schedule.timezone;
  } catch {
    return defaultSettings.schedule.timezone;
  }
};

export const createInitialSettings = (): Settings => ({
  ...defaultSettings,
  schedule: {
    ...defaultSettings.schedule,
    timezone: resolveRuntimeTimezone(),
  },
});

export default defaultSettings;
