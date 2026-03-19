import { useMemo, useState } from 'react';

import styles from './OptionsApp.module.css';
import StatsGrid from './StatsGrid';
import Preferences from './tabs/Preferences';
import Rules from './tabs/Rules';
import Scheduling from './tabs/Scheduling';

import Hero from '@/components/ui/Hero';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import useBlockRules from '@/hooks/useBlockRules';
import useThemeEffect from '@/hooks/useThemeEffect';

type OptionsTab = 'rules' | 'scheduling' | 'preferences';

const OPTIONS_TABS: ReadonlyArray<TabItem<OptionsTab>> = [
  { id: 'rules', label: 'Rules' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'preferences', label: 'Preferences' },
];

const OptionsApp = () => {
  useThemeEffect();
  const { blockRules } = useBlockRules();
  const [activeTab, setActiveTab] = useState<OptionsTab>('rules');

  const activeRuleCount = useMemo(() => blockRules?.filter((rule) => rule.enabled).length ?? 0, [blockRules]);
  const pausedRuleCount = useMemo(
    () => blockRules?.filter((rule) => rule.unblockUntil && rule.unblockUntil > Date.now()).length ?? 0,
    [blockRules],
  );

  return (
    <main className={styles.page}>
      <Hero
        title='Focus controls'
        subheading='Keep your rules clear, adjust unblock friction, and tune the extension for long-term focus.'
      />
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

      {activeTab === 'preferences' ? <Preferences className={styles.section} /> : null}
      {activeTab === 'scheduling' ? <Scheduling className={styles.section} /> : null}
      {activeTab === 'rules' ? (
        <Rules
          className={styles.section}
          onClickEditSchedule={() => setActiveTab('scheduling')}
        />
      ) : null}
    </main>
  );
};

export default OptionsApp;
