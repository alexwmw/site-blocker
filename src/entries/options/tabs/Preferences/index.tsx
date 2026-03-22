import { useEffect, useState } from 'react';

import styles from '../../OptionsApp.module.css';
import OptionsTab from '../OptionsTab';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Switch from '@/components/primitives/Switch';
import SectionHeader from '@/components/shared/SectionHeader';
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
          <div className={styles.settingsGrid}>
            <label className={styles.settingsLabel}>
              Hold to unblock (seconds)
              <input
                className={styles.settingsInput}
                type='number'
                min={SETTINGS_LIMITS.holdDurationMinSeconds}
                max={SETTINGS_LIMITS.holdDurationMaxSeconds}
                value={settings.holdDurationSeconds}
                onChange={(event) => {
                  handleHoldDurationChange(event.target.value);
                }}
              />
              <span className={styles.fieldHint}>
                Require between {SETTINGS_LIMITS.holdDurationMinSeconds} and {SETTINGS_LIMITS.holdDurationMaxSeconds}{' '}
                seconds before a blocked page can be reopened.
              </span>
            </label>

            <label className={styles.settingsLabel}>
              Block page headline
              <input
                className={styles.settingsInput}
                type='text'
                maxLength={SETTINGS_LIMITS.blockPageHeadlineMaxLength}
                value={settings.blockPageHeadline}
                onChange={(event) => {
                  handleHeadlineChange(event.target.value);
                }}
              />
              <span className={styles.fieldHint}>Short motivational title shown on the block page.</span>
            </label>
          </div>

          <Switch
            id='extended-unblock-enabled'
            label='Allow temporary unblock after a successful hold'
            description='Keep a blocked site available for a limited time before the rule starts blocking it again.'
            descriptionClassName={styles.fieldHint}
            checked={settings.extendedUnblock.enabled}
            onChange={(event) => {
              handleExtendedUnblockEnabledChange(event.target.checked);
            }}
          />

          <label className={styles.settingsLabel}>
            Temporary unblock duration (minutes)
            <input
              className={styles.settingsInput}
              type='number'
              min={SETTINGS_LIMITS.extendedUnblockDurationMinMinutes}
              max={SETTINGS_LIMITS.extendedUnblockDurationMaxMinutes}
              value={settings.extendedUnblock.durationMinutes}
              disabled={!settings.extendedUnblock.enabled}
              onChange={(event) => {
                handleExtendedUnblockDurationChange(event.target.value);
              }}
            />
            <span className={styles.fieldHint}>
              When enabled, each unblock can stay active for {SETTINGS_LIMITS.extendedUnblockDurationMinMinutes}–
              {SETTINGS_LIMITS.extendedUnblockDurationMaxMinutes} minutes.
            </span>
          </label>
        </Card>

        <Card
          padding
          className={styles.preferenceCard}
        >
          <SectionHeader title='Appearance' />
          <div className={styles.settingsGrid}>
            <label className={styles.settingsLabel}>
              Theme
              <select
                className={styles.settingsInput}
                value={theme}
                onChange={(event) => {
                  handleThemeChange((event.target.value + '-' + mode) as Theme);
                }}
              >
                <option value='intention'>Intentional</option>
                <option value='mindful'>Mindful</option>
                <option value='focus'>Focused</option>
              </select>
            </label>{' '}
            <label className={styles.settingsLabel}>
              Mode
              <select
                className={styles.settingsInput}
                value={mode}
                onChange={(event) => {
                  handleThemeChange((theme + '-' + event.target.value) as Theme);
                }}
              >
                <option value='light'>Light</option>
                <option value='dark'>Dark</option>
              </select>
            </label>
          </div>
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
