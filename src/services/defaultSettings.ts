import type { Settings } from '@/types/schema';

export const defaultSettings: Settings = {
  theme: 'mindful-light',
  blockPageHeadline: 'Stay on track',
  holdDurationSeconds: 15,
  schedule: {
    enabled: false,
    windows: [
      {
        id: '_initial',
        days: [true, true, true, true, true, false, false],
        start: '09:00',
        end: '17:00',
      },
    ],
  },
  extendedUnblock: {
    enabled: true,
    durationMinutes: 10,
  },
  isRated: false,
};

export const defaultPreferenceSettings = {
  theme: defaultSettings.theme,
  blockPageHeadline: defaultSettings.blockPageHeadline,
  holdDurationSeconds: defaultSettings.holdDurationSeconds,
  extendedUnblock: defaultSettings.extendedUnblock,
  isRated: defaultSettings.isRated,
} satisfies Pick<Settings, 'theme' | 'blockPageHeadline' | 'holdDurationSeconds' | 'extendedUnblock' | 'isRated'>;

export default defaultSettings;
