import styles from '../OptionsApp.module.css';
import OptionsTab from '../OptionsTab';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import Switch from '@/components/ui/Switch';
import { defaultPreferenceSettings } from '@/services/defaultSettings';
import { SETTINGS_LIMITS, type Settings, type Theme } from '@/types/schema';

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

  const handleRatedChange = (isRated: boolean) => {
    updateSettings({ isRated }).catch(console.error);
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
                value={settings.theme}
                onChange={(event) => {
                  handleThemeChange(event.target.value as Theme);
                }}
              >
                <option value='intention-light'>Intentional (light)</option>
                <option value='intention-dark'>Intentional (dark)</option>
                <option value='mindful-light'>Mindful (light)</option>
                <option value='mindful-dark'>Mindful (dark)</option>
                <option value='focus-light'>Focused (light)</option>
                <option value='focus-dark'>Focused (dark)</option>
              </select>
            </label>
          </div>
        </Card>

        <Card
          padding
          className={styles.preferenceCard}
        >
          <SectionHeader title='Notifications' />
          <Switch
            id='is-rated'
            label='I have already rated or reviewed the extension'
            description='Use this to suppress future rate-and-review nudges tied to your settings profile.'
            checked={settings.isRated}
            onChange={(event) => {
              handleRatedChange(event.target.checked);
            }}
          />
        </Card>

        <Card
          padding
          className={styles.preferenceCard}
        >
          <SectionHeader title='Account & licensing' />
          <p className={styles.fieldHint}>
            This version of Site Blocker does not require sign-in or a paid license. Your preferences are stored locally
            in the extension.
          </p>
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
