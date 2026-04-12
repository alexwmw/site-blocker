import { defaultPreferenceSettings } from '@/services/defaultSettings';
import type { Settings, Theme } from '@/types/schema';
import { SETTINGS_LIMITS } from '@/types/schema';

const parseIntegerInput = (value: string): number | null => {
  if (value.trim() === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const useOptionChangeHandlers = (
  settings: Settings | null,
  updateSettings: (updates: Partial<Settings>) => Promise<void>,
) => {
  const handleThemeChange = (theme: Theme) => {
    updateSettings({ theme }).catch(console.error);
  };

  const handleHoldDurationChange = (value: string) => {
    const parsed = parseIntegerInput(value);
    const holdDurationSeconds =
      parsed === null
        ? defaultPreferenceSettings.holdDurationSeconds
        : clamp(Math.round(parsed), SETTINGS_LIMITS.holdDurationMinSeconds, SETTINGS_LIMITS.holdDurationMaxSeconds);

    updateSettings({ holdDurationSeconds }).catch(console.error);
  };

  const handleHeadlineChange = (value: string) => {
    const blockPageHeadline = value.trim().slice(0, SETTINGS_LIMITS.blockPageHeadlineMaxLength);

    updateSettings({
      blockPageHeadline: blockPageHeadline.length > 0 ? blockPageHeadline : defaultPreferenceSettings.blockPageHeadline,
    }).catch(console.error);
  };

  const handleExtendedUnblockEnabledChange = (enabled: boolean) => {
    if (settings === null) {
      return;
    }
    updateSettings({
      extendedUnblock: {
        ...settings.extendedUnblock,
        enabled,
      },
    }).catch(console.error);
  };

  const handleExtendedUnblockDurationChange = (value: string) => {
    if (settings === null) {
      return;
    }
    const parsed = parseIntegerInput(value);
    const durationMinutes =
      parsed === null
        ? defaultPreferenceSettings.extendedUnblock.durationMinutes
        : clamp(
            Math.round(parsed),
            SETTINGS_LIMITS.extendedUnblockDurationMinMinutes,
            SETTINGS_LIMITS.extendedUnblockDurationMaxMinutes,
          );

    updateSettings({
      extendedUnblock: {
        ...settings.extendedUnblock,
        durationMinutes,
      },
    }).catch(console.error);
  };

  const handleResetPreferences = () => {
    updateSettings(defaultPreferenceSettings).catch(console.error);
  };

  return {
    handleExtendedUnblockDurationChange,
    handleExtendedUnblockEnabledChange,
    handleHeadlineChange,
    handleHoldDurationChange,
    handleResetPreferences,
    handleThemeChange,
  };
};

export default useOptionChangeHandlers;
