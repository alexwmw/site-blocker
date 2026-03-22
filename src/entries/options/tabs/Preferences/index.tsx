import { useEffect, useState } from 'react';

import OptionsTab from '../OptionsTab';

import styles from './Preferences.module.css';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Setting from '@/components/primitives/Setting';
import Switch from '@/components/primitives/Switch';
import SectionHeader from '@/components/shared/SectionHeader';
import SettingsGrid from '@/components/shared/SettingsGrid';
import { defaultPreferenceSettings } from '@/services/defaultSettings';
import { type Settings, SETTINGS_LIMITS, type Theme } from '@/types/schema';

type PreferencesProps = {
  className?: string;
  settings: Settings | null;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
};

const parseIntegerInput = (value: string): number | null => {
  if (value.trim() === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const Preferences = ({ className, settings, updateSettings }: PreferencesProps) => {
  const [[theme, mode], setModeAndTheme] = useState<string[]>([]);

  useEffect(() => {
    if (settings?.theme) {
      setModeAndTheme(settings.theme.split('-'));
    }
  }, [settings?.theme]);

  if (!settings) {
    return (
      <OptionsTab
        title='Preference'
        className={className}
      />
    );
  }

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
    updateSettings({
      extendedUnblock: {
        ...settings.extendedUnblock,
        enabled,
      },
    }).catch(console.error);
  };

  const handleExtendedUnblockDurationChange = (value: string) => {
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

  return (
    <OptionsTab
      title='Preference'
      className={className}
    >
      <div className={styles.preferenceSectionStack}>
        <Card
          padding
          className={styles.preferenceCard}
        >
          <SectionHeader title='Blocking behavior' />
          <SettingsGrid>
            <Setting
              label='Hold to unblock (seconds)'
              type='number'
              min={SETTINGS_LIMITS.holdDurationMinSeconds}
              max={SETTINGS_LIMITS.holdDurationMaxSeconds}
              value={settings.holdDurationSeconds}
              onChange={(event) => {
                handleHoldDurationChange(event.target.value);
              }}
              fieldHint={`Require between ${SETTINGS_LIMITS.holdDurationMinSeconds} and ${SETTINGS_LIMITS.holdDurationMaxSeconds} seconds before a blocked page can be reopened.`}
            />
            <Setting
              label='Block page headline'
              type='text'
              maxLength={SETTINGS_LIMITS.blockPageHeadlineMaxLength}
              value={settings.blockPageHeadline}
              onChange={(event) => {
                handleHeadlineChange(event.target.value);
              }}
              fieldHint='Short motivational title shown on the block page.'
            />
          </SettingsGrid>

          <Switch
            id='extended-unblock-enabled'
            label='Allow temporary unblock after a successful hold'
            fieldHint='Keep a blocked site available for a limited time before the rule starts blocking it again.'
            checked={settings.extendedUnblock.enabled}
            onChange={(event) => {
              handleExtendedUnblockEnabledChange(event.target.checked);
            }}
          />

          <Setting
            label='Temporary unblock duration (minutes)'
            type='number'
            min={SETTINGS_LIMITS.extendedUnblockDurationMinMinutes}
            max={SETTINGS_LIMITS.extendedUnblockDurationMaxMinutes}
            value={settings.extendedUnblock.durationMinutes}
            disabled={!settings.extendedUnblock.enabled}
            onChange={(event) => {
              handleExtendedUnblockDurationChange(event.target.value);
            }}
            fieldHint={`When enabled, each unblock can stay active for ${SETTINGS_LIMITS.extendedUnblockDurationMinMinutes}–${SETTINGS_LIMITS.extendedUnblockDurationMaxMinutes} minutes.`}
          />
        </Card>

        <Card
          padding
          className={styles.preferenceCard}
        >
          <SectionHeader title='Appearance' />
          <SettingsGrid>
            <Setting
              as='select'
              label='Theme'
              value={theme}
              onChange={(event) => {
                handleThemeChange((event.target.value + '-' + mode) as Theme);
              }}
              options={[
                { value: 'intention', label: 'Intentional' },
                { value: 'mindful', label: 'Mindful' },
                { value: 'focus', label: 'Focused' },
              ]}
            />
            <Setting
              as='select'
              label='Mode'
              value={mode}
              onChange={(event) => {
                handleThemeChange((theme + '-' + event.target.value) as Theme);
              }}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </SettingsGrid>
        </Card>

        <div className={styles.preferenceActions}>
          <Button
            variant='secondary'
            onClick={handleResetPreferences}
          >
            Reset preferences to defaults
          </Button>
        </div>
      </div>
    </OptionsTab>
  );
};

export default Preferences;
