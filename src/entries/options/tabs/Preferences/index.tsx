import { ExternalLink } from 'lucide-react';

import OptionsTab from '../OptionsTab';

import styles from './Preferences.module.css';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Paragraph from '@/components/primitives/Paragraph';
import Setting from '@/components/primitives/Setting';
import Stack from '@/components/primitives/Stack';
import Switch from '@/components/primitives/Switch';
import SectionHeader from '@/components/shared/SectionHeader';
import SettingsGrid from '@/components/shared/SettingsGrid';
import ThemeSelector from '@/components/shared/ThemeSelector';
import useOptionChangeHandlers from '@/entries/options/useOptionChangeHandlers';
import { type Settings, SETTINGS_LIMITS } from '@/types/schema';
import { getAllowIncognitoUrl, getPinToToolbarUrl, getRemoveExtensionUrl } from '@/utils/extensionUrls';

type PreferencesProps = {
  className?: string;
  settings: Settings | null;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
};

const Preferences = ({ className, settings, updateSettings }: PreferencesProps) => {
  const {
    handleExtendedUnblockDurationChange,
    handleExtendedUnblockEnabledChange,
    handleHeadlineChange,
    handleHoldDurationChange,
    handleResetPreferences,
    handleThemeChange,
  } = useOptionChangeHandlers(settings, updateSettings);

  if (!settings) {
    return (
      <OptionsTab
        title='Preferences'
        className={className}
      />
    );
  }

  const pinToToolbar = () => {
    chrome.tabs.create({ url: getPinToToolbarUrl() }).catch(console.error);
  };

  const allowIncognito = () => {
    chrome.tabs.create({ url: getAllowIncognitoUrl() }).catch(console.error);
  };
  const removeExtension = () => {
    chrome.tabs.create({ url: getRemoveExtensionUrl() }).catch(console.error);
  };

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
          <ThemeSelector
            theme={settings.theme}
            handleThemeChange={handleThemeChange}
            previewHeight={160}
          />
        </Card>
        <Card padding>
          <SectionHeader title='Extension settings' />
          <Stack>
            <Paragraph subtle>
              These options are controlled by the browser. Selecting the links below will open the Chrome extensions
              settings page.
            </Paragraph>
            <SettingsGrid>
              <Button
                onClick={pinToToolbar}
                variant='secondary'
              >
                <ExternalLink />
                Pin to toolbar
              </Button>
              <Button
                onClick={allowIncognito}
                variant='secondary'
              >
                <ExternalLink />
                Allow in incognito
              </Button>
              <Button
                onClick={removeExtension}
                variant='secondary'
              >
                <ExternalLink />
                Remove extension
              </Button>
            </SettingsGrid>
          </Stack>
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
