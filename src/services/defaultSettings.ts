import type { Settings } from '../types/schema';

const defaultSettings: Settings = {
  theme: 'light',
  holdDurationSeconds: 20,
  schedule: {
    enabled: true,
    activeDays: [false, false, false, false, false, false, false],
    allDay: false,
    start: '00:00',
    end: '23:59',
  },
  revisit: {
    enabled: true,
    durationMinutes: 10,
  },
  isRated: false,
};

export default defaultSettings;
