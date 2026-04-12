import { useEffect, useState } from 'react';

import OptionsTab from '../OptionsTab';

import styles from './Preferences.module.css';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Setting from '@/components/primitives/Setting';
import Stack from '@/components/primitives/Stack';
import Switch from '@/components/primitives/Switch';
import SectionHeader from '@/components/shared/SectionHeader';
import SettingsGrid from '@/components/shared/SettingsGrid';
import useOptionChangeHandlers from '@/entries/options/useOptionChangeHandlers';
import { type Settings, SETTINGS_LIMITS, type Theme } from '@/types/schema';

type PreferencesProps = {
  className?: string;
  settings: Settings | null;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
};

const Preferences = ({ className, settings }: PreferencesProps) => {
  const [[theme, mode], setModeAndTheme] = useState<string[]>([]);
  const {
    handleExtendedUnblockDurationChange,
    handleExtendedUnblockEnabledChange,
    handleHeadlineChange,
    handleHoldDurationChange,
    handleResetPreferences,
    handleThemeChange,
  } = useOptionChangeHandlers(settings);

  useEffect(() => {
    if (settings?.theme) {
      setModeAndTheme(settings.theme.split('-'));
    }
  }, [settings?.theme]);

  if (!settings) {
    return (
      <OptionsTab
        title='Preferences'
        className={className}
      />
    );
  }

  return (
    <OptionsTab
      title='Preferences'
      className={className}
    >
      <Stack>
        <Card
          padding
          className={styles.preferenceCard}
        >
          <SectionHeader title='Blocking behavior' />
          <SettingsGrid>
            <Setting
              settingId='holdToUnblock'
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
              settingId='blockPageHeadline'
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
            settingId='extendedUnblock'
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
              settingId='theme'
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
              settingId='mode'
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
      </Stack>
    </OptionsTab>
  );
};

export default Preferences;
