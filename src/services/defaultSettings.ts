import type { Settings } from '../types/schema';

const defaultSettings: Settings = {
  theme: 'light',
  holdDurationSeconds: 20,
  schedule: {
    enabled: false,
    activeDays: [false, false, false, false, false, false, false],
    allDay: false,
    start: '00:00',
    end: '23:59',
  },
  extendedUnblock: {
    enabled: true,
    durationMinutes: 10,
  },
  isRated: false,
};

export default defaultSettings;
