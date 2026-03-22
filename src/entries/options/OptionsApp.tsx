import { useMemo, useState } from 'react';

import StatsGrid from '../../components/shared/StatsGrid';

import styles from './OptionsApp.module.css';
import Preferences from './tabs/Preferences';
import Rules from './tabs/Rules';
import Scheduling from './tabs/Scheduling';

import Tabs, { type TabItem } from '@/components/primitives/Tabs';
import Hero from '@/components/shared/Hero';
import RenderBoundary from '@/components/shared/RenderBoundary';
import useBlockRules from '@/hooks/useBlockRules';
import useSettings from '@/hooks/useSettings';
import useThemeEffect from '@/hooks/useThemeEffect';
import { StorageService } from '@/services/StorageService';
import type { ScheduleWindow, Settings } from '@/types/schema';
import { createUniqueId } from '@/utils/createUniqueId';

type OptionsTab = 'rules' | 'scheduling' | 'preferences';

const OPTIONS_TABS: ReadonlyArray<TabItem<OptionsTab>> = [
  { id: 'rules', label: 'Rules' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'preferences', label: 'Preferences' },
];

const createNewScheduleWindow: () => ScheduleWindow = () => ({
  id: createUniqueId(),
  days: [false, false, false, false, false, false, false],
  start: '09:00',
  end: '17:00',
});

const OptionsApp = () => {
  useThemeEffect();
  const { blockRules, error: blockRulesError, removeRule, updateRule } = useBlockRules();
  const { settings, error: settingsError, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<OptionsTab>('rules');

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
        <StatsGrid
          stats={{
            'Total rules': blockRules?.length ?? 0,
            'Active rules': activeRuleCount - pausedRuleCount,
            'Temporarily allowed': pausedRuleCount,
          }}
        />
        <Tabs
          className={styles.tabs}
          ariaLabel='Options sections'
          items={OPTIONS_TABS}
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
      </RenderBoundary>
    </main>
  );
};

export default OptionsApp;
