import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import StatsGrid from '../../components/shared/StatsGrid';

import styles from './OptionsApp.module.css';
import GetStarted from './tabs/GetStarted';
import Preferences from './tabs/Preferences';
import Rules from './tabs/Rules';
import Scheduling from './tabs/Scheduling';

import Tabs, { type TabItem } from '@/components/primitives/Tabs';
import Hero from '@/components/shared/Hero';
import RenderBoundary from '@/components/shared/RenderBoundary';
import StarterModal from '@/entries/options/onboarding/StarterModal';
import useBlockRules from '@/hooks/useBlockRules';
import useSettings from '@/hooks/useSettings';
import useThemeEffect from '@/hooks/useThemeEffect';
import { SchedulingService } from '@/services/SchedulingService';
import { StorageService } from '@/services/StorageService';
import type { ScheduleWindow, Settings, Theme } from '@/types/schema';
import { createUniqueId } from '@/utils/createUniqueId';

type OptionsTab = 'rules' | 'scheduling' | 'preferences' | 'get-started';

const OPTIONS_TABS: ReadonlyArray<TabItem<OptionsTab>> = [
  { id: 'rules', label: 'Rules' },
  { id: 'scheduling', label: 'Schedule' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'get-started', label: 'Get started' },
];

const createNewScheduleWindow: () => ScheduleWindow = () => ({
  id: createUniqueId(),
  days: [false, false, false, false, false, false, false],
  start: '09:00',
  end: '17:00',
});

const getTabIdFromUrlParams = (): OptionsTab => {
  const queryString = window.location.search;
  const p = new URLSearchParams(queryString);
  const tabId = p.get('tabId');
  return OPTIONS_TABS.find((t) => t.id === tabId)?.id ?? 'rules';
};

const getIsOnboardingFromUrlParams = (): boolean => {
  const queryString = window.location.search;
  const p = new URLSearchParams(queryString);
  const val = p.get('showOnboarding');
  return val === 'true';
};

async function setInitialTheme() {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const initialTheme: Theme = isDarkMode ? 'focus-dark' : 'focus-light';
  await StorageService.updateSettings({
    theme: initialTheme,
  });
}

const OptionsApp = () => {
  useThemeEffect();
  const { blockRules, error: blockRulesError, removeRule, updateRule, addRule } = useBlockRules();
  const { settings, error: settingsError, updateSettings } = useSettings();
  const showOnboarding = useMemo(() => getIsOnboardingFromUrlParams(), []);
  const [activeTab, setActiveTab] = useState<OptionsTab>(showOnboarding ? 'get-started' : getTabIdFromUrlParams());
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [modalClosed, setModalClosed] = useState(false);

  useEffect(() => {
    if (showOnboarding && !modalClosed && blockRules && blockRules.length === 0) {
      setInitialTheme().catch(console.error);
      dialogRef.current?.showModal();
    }
    if (activeTab !== 'get-started') {
      setModalClosed(true);
    }
  }, [showOnboarding, dialogRef, blockRules, modalClosed, activeTab]);

  const closeModal = useCallback(() => {
    dialogRef.current?.close();
    setModalClosed(true);
  }, [dialogRef]);

  const optionsData = blockRules && settings ? { blockRules, settings } : null;
  const activeRuleCount = useMemo(() => blockRules?.filter((rule) => rule.enabled).length ?? 0, [blockRules]);
  const pausedRuleCount = useMemo(
    () => blockRules?.filter((rule) => rule.unblockUntil && rule.unblockUntil > Date.now()).length ?? 0,
    [blockRules],
  );

  const handleUpdateSettings = async (updates: Partial<Settings>) => {
    await updateSettings(updates);
  };

  const handleSetSchedulingEnabled = async (enabled: boolean) => {
    if (!settings) {
      return;
    }

    await updateSettings({
      schedule: {
        ...settings.schedule,
        enabled,
      },
    });
  };

  const handleAddScheduleWindow = async () => {
    await StorageService.addScheduleWindow(createNewScheduleWindow());
  };

  const handleRemoveScheduleWindow = async (id: string) => {
    await StorageService.removeScheduleWindow(id);
  };

  const handleUpdateScheduleWindow = async (id: string, updates: Partial<ScheduleWindow>) => {
    await StorageService.updateScheduleWindow(id, updates);
  };

  const statsToDisplay = useMemo(() => {
    return {
      'Total rules': blockRules?.length ?? 0,
      'Active rules': SchedulingService.isBlockingActiveNow(settings?.schedule) ? activeRuleCount - pausedRuleCount : 0,
      'Temporarily allowed': pausedRuleCount,
    };
  }, [activeRuleCount, blockRules?.length, pausedRuleCount, settings?.schedule]);

  return (
    <main className={styles.page}>
      <Hero
        title='Focus controls'
        subheading='Keep your rules clear, adjust unblock friction, and tune the extension for long-term focus.'
      />
      <RenderBoundary
        data={optionsData}
        error={blockRulesError ?? settingsError}
      >
        {!showOnboarding ? <StatsGrid stats={statsToDisplay} /> : null}
        <Tabs
          className={clsx(styles.tabs)}
          ariaLabel='Options sections'
          items={showOnboarding ? [...OPTIONS_TABS].reverse() : OPTIONS_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {activeTab === 'preferences' ? (
          <Preferences
            className={styles.section}
            settings={settings}
            updateSettings={handleUpdateSettings}
          />
        ) : null}
        {activeTab === 'scheduling' ? (
          <Scheduling
            className={styles.section}
            schedule={settings?.schedule ?? null}
            addScheduleWindow={handleAddScheduleWindow}
            removeScheduleWindow={handleRemoveScheduleWindow}
            setSchedulingEnabled={handleSetSchedulingEnabled}
            updateScheduleWindow={handleUpdateScheduleWindow}
          />
        ) : null}
        {activeTab === 'rules' ? (
          <Rules
            className={styles.section}
            blockRules={blockRules ?? []}
            removeRule={removeRule}
            schedule={settings?.schedule ?? null}
            updateRule={updateRule}
            onClickEditSchedule={() => setActiveTab('scheduling')}
          />
        ) : null}
        {activeTab === 'get-started' ? (
          <GetStarted
            className={styles.section}
            blockRules={blockRules ?? []}
            addRule={addRule}
          />
        ) : null}
        {showOnboarding ? (
          <StarterModal
            dialogRef={dialogRef}
            close={closeModal}
          />
        ) : null}
      </RenderBoundary>
    </main>
  );
};

export default OptionsApp;
