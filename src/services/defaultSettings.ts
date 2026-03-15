import type { Settings } from '../types/schema';

const defaultSettings: Settings = {
  theme: 'light',
  holdDurationSeconds: 20,
  schedule: {
    enabled: false,
    timezone: '',
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

export default defaultSettings;
