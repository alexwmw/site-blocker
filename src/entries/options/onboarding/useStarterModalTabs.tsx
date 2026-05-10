import { useMemo } from 'react';

import ExtensionIcon from '@/assets/icons/icon-white-on-bg.svg?react';
import HoldTitle from '@/assets/icons/title-brand-colors.svg?react';
import Paragraph from '@/components/primitives/Paragraph';
import Setting from '@/components/primitives/Setting';
import Stack from '@/components/primitives/Stack';
import Hold from '@/components/shared/Hold';
import PopularWebsitesSelector from '@/components/shared/PopularWebsitesSelector';
import SettingsGrid from '@/components/shared/SettingsGrid';
import ThemeSelector from '@/components/shared/ThemeSelector';
import HoldButton from '@/entries/block-page/components/BlockPageButton';
import useButtonEventHandlers from '@/entries/block-page/hooks/useButtonEventHandlers';
import SchedulingWindow from '@/entries/options/tabs/Scheduling/SchedulingWindow';
import useOptionChangeHandlers from '@/entries/options/useOptionChangeHandlers';
import useBlockRules from '@/hooks/useBlockRules';
import useSettings from '@/hooks/useSettings';
import { SETTINGS_LIMITS } from '@/types/schema';

const useStarterModalTabs = () => {
  const { blockRules, addRule } = useBlockRules();
  const { settings, updateSettings } = useSettings();
  const { handleHoldDurationChange, handleThemeChange } = useOptionChangeHandlers(settings, updateSettings);

  const { onKeyDown, onMouseDown, timeRemaining, held } = useButtonEventHandlers(settings?.holdDurationSeconds ?? 0);

  return useMemo(() => {
    if (!blockRules) {
      return [];
    }
    return [
      <>
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <header>
            <HoldTitle width='200px' />
          </header>
          <h2>Welcome to Hold!</h2>
        </div>
        <Stack gap='x-small'>
          <Paragraph centered>
            <Hold /> is a website blocker with mindfulness at its core.
          </Paragraph>
          <Paragraph centered>
            It helps you stay mindful of your browsing habits by gently interrupting distracting websites before you
            dive in.
          </Paragraph>
        </Stack>
      </>,
      <>
        <h2>Introducing the Hold button</h2>
        <Stack gap='x-small'>
          <Paragraph>
            When you visit a distracting site, the <strong>Hold button</strong> gives you a quick way to pause and check
            in with your intentions.
          </Paragraph>
          <Paragraph>Hold the button for the set duration to unblock the website temporarily. </Paragraph>
          <Paragraph strong>Try it out below!</Paragraph>
          <HoldButton
            remainingTime={timeRemaining}
            onMouseDown={onMouseDown}
            onKeyDown={onKeyDown}
            autoFocus={false}
            holdIsComplete={timeRemaining === 0}
            animationDuration={settings?.holdDurationSeconds ?? 0}
            held={held}
          />
        </Stack>
      </>,
      <>
        <h2>Make it yours</h2>
        <Paragraph>
          There are lots of ways to customise <Hold />. Here are a couple of settings to get started. You can change
          these any time in the <strong>Preferences</strong> tab.
        </Paragraph>
        <Stack gap='x-small'>
          <h3>Choose how long to hold the Hold button</h3>
          <SettingsGrid>
            <Setting
              settingId='holdToUnblock'
              label='Hold to unblock (seconds)'
              type='number'
              min={SETTINGS_LIMITS.holdDurationMinSeconds}
              max={SETTINGS_LIMITS.holdDurationMaxSeconds}
              value={settings?.holdDurationSeconds}
              onChange={(event) => {
                handleHoldDurationChange(event.target.value);
              }}
              fieldHint={`Require between ${SETTINGS_LIMITS.holdDurationMinSeconds} and ${SETTINGS_LIMITS.holdDurationMaxSeconds} seconds before a blocked page can be reopened.`}
            />
          </SettingsGrid>
        </Stack>
      </>,
      <>
        <h2>Make it yours</h2>
        <Paragraph>
          There are lots of ways to customise <Hold />. Here are a couple of settings to get started. You can change
          these any time in the <strong>Preferences</strong> tab.
        </Paragraph>
        <Stack gap='x-small'>
          <h3>Choose your theme</h3>
          {settings ? (
            <ThemeSelector
              theme={settings.theme}
              handleThemeChange={handleThemeChange}
              previewHeight={66}
            />
          ) : null}
          <br />
        </Stack>
      </>,
      <>
        <h2>Set a schedule</h2>
        <Stack gap='x-small'>
          <Paragraph>
            You can set a blocking schedule any time in the <strong>Schedule</strong> tab.{' '}
          </Paragraph>
          <br />
          {settings ? (
            <div
              style={{
                userSelect: 'none',
                pointerEvents: 'none',
                cursor: 'default',
                filter: 'drop-shadow(4px 4px 3px rgba(0, 0, 0, 0.1))',
              }}
            >
              <SchedulingWindow
                window={settings.schedule.windows[0]}
                disabled={true}
                windowIndex={0}
                removeWindow={() => new Promise((resolve) => {})}
                updateWindow={() => new Promise((resolve) => {})}
              />
            </div>
          ) : null}
        </Stack>
      </>,
      <>
        <h2>Start by blocking some sites</h2>
        <Stack gap='x-small'>
          <Paragraph>
            Choose some popular websites to get started. You can edit these later in the <strong>Rules</strong> tab.
          </Paragraph>
          <Paragraph>
            You can add your own choices at any time by selecting the extension icon (
            <ExtensionIcon
              height='1rem'
              style={{ translate: '0 2px' }}
            />
            ) in the main toolbar.
          </Paragraph>
          <br />
          <PopularWebsitesSelector
            blockRules={blockRules}
            addRule={addRule}
          />
        </Stack>
      </>,
    ];
  }, [
    addRule,
    blockRules,
    handleHoldDurationChange,
    handleThemeChange,
    held,
    onKeyDown,
    onMouseDown,
    settings,
    timeRemaining,
  ]);
};

export default useStarterModalTabs;
