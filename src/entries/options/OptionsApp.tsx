import { useMemo, useState } from 'react';

import Card from '../../components/ui/Card';
import EyebrowLabel from '../../components/ui/EyebrowLabel';
import SectionHeader from '../../components/ui/SectionHeader';
import Switch from '../../components/ui/Switch';
import Tabs, { type TabItem } from '../../components/ui/Tabs';
import useBlockRules from '../../hooks/useBlockRules';
import useSettings from '../../hooks/useSettings';
import useThemeEffect from '../../hooks/useThemeEffect';
import type { BlockRule, ScheduleWindow, Theme } from '../../types/schema';

import styles from './OptionsApp.module.css';

const SCHEDULE_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

type OptionsTab = 'rules' | 'scheduling' | 'preferences';

const OPTIONS_TABS: ReadonlyArray<TabItem<OptionsTab>> = [
  { id: 'rules', label: 'Rules' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'preferences', label: 'Preferences' },
];

const readableDate = (dateIso: string) => {
  const date = new Date(dateIso);
  return Number.isNaN(date.valueOf()) ? 'Unknown date' : date.toLocaleString();
};

const OptionsApp = () => {
  useThemeEffect();
  const { blockRules, removeRule, updateRule, isLoading: isRulesLoading } = useBlockRules();
  const { settings, updateSettings, isLoading: isSettingsLoading } = useSettings();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingMatchTypeRuleId, setPendingMatchTypeRuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OptionsTab>('rules');

  const activeRuleCount = useMemo(() => blockRules?.filter((rule) => rule.enabled).length ?? 0, [blockRules]);

  const pausedRuleCount = useMemo(
    () => blockRules?.filter((rule) => rule.unblockUntil && rule.unblockUntil > Date.now()).length ?? 0,
    [blockRules],
  );

  const handleRemove = async (ruleId: string) => {
    setPendingDeleteId(ruleId);
    try {
      await removeRule(ruleId);
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleThemeChange = (theme: Theme) => {
    updateSettings({ theme }).catch(console.error);
  };

  const handleHoldDurationChange = (value: number) => {
    const clamped = Math.max(3, Math.min(99, value));
    updateSettings({ holdDurationSeconds: clamped }).catch(console.error);
  };

  const handleScheduleEnabledChange = (enabled: boolean) => {
    if (!settings) {
      return;
    }

    updateSettings({
      schedule: {
        ...settings.schedule,
        enabled,
      },
    }).catch(console.error);
  };

  const handleScheduleWindowChange = (updates: Partial<ScheduleWindow>) => {
    if (!settings || settings.schedule.windows.length === 0) {
      return;
    }

    const [firstWindow, ...rest] = settings.schedule.windows;
    updateSettings({
      schedule: {
        ...settings.schedule,
        windows: [{ ...firstWindow, ...updates }, ...rest],
      },
    }).catch(console.error);
  };

  const handleScheduleDayToggle = (dayIndex: number, checked: boolean) => {
    if (!settings || settings.schedule.windows.length === 0) {
      return;
    }

    const [firstWindow, ...rest] = settings.schedule.windows;
    const nextDays = [...firstWindow.days] as typeof firstWindow.days;
    nextDays[dayIndex] = checked;

    updateSettings({
      schedule: {
        ...settings.schedule,
        windows: [{ ...firstWindow, days: nextDays }, ...rest],
      },
    }).catch(console.error);
  };


  const handleMatchTypeToggle = async (rule: BlockRule, shouldBlockSubpages: boolean) => {
    setPendingMatchTypeRuleId(rule.id);
    try {
      await updateRule(rule.id, {
        matchType: shouldBlockSubpages ? 'prefix' : 'exact',
      });
    } finally {
      setPendingMatchTypeRuleId(null);
    }
  };

  const renderRule = (rule: BlockRule) => {
    const unblockState =
      rule.unblockUntil && rule.unblockUntil > Date.now()
        ? `Temporarily allowed until ${new Date(rule.unblockUntil).toLocaleTimeString()}`
        : 'Blocked now';

    return (
      <li key={rule.id}>
        <Card className={styles.ruleCard}>
          <div>
            <p className={styles.rulePattern}>{rule.pattern}</p>
            <p className={styles.ruleMeta}>
              Match: <strong>{rule.matchType}</strong> · Added {readableDate(rule.createdAt)}
            </p>
            <p className={styles.ruleMeta}>{unblockState}</p>
            <Switch
              className={styles.ruleSwitch}
              label='Block subpages'
              description={rule.matchType === 'prefix' ? 'On · Prefix match' : 'Off · Exact match'}
              checked={rule.matchType === 'prefix'}
              disabled={pendingMatchTypeRuleId === rule.id}
              onChange={(event) => {
                handleMatchTypeToggle(rule, event.target.checked).catch(console.error);
              }}
            />
          </div>
          <button
            className={styles.dangerButton}
            onClick={() => {
              handleRemove(rule.id).catch(console.error);
            }}
            disabled={pendingDeleteId === rule.id}
          >
            {pendingDeleteId === rule.id ? 'Removing…' : 'Remove'}
          </button>
        </Card>
      </li>
    );
  };

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <EyebrowLabel>Site Blocker</EyebrowLabel>
        <h1 className={styles.heroTitle}>Focus controls</h1>
        <p className={styles.subtle}>
          Keep your rules clear, adjust unblock friction, and tune the extension for long-term focus.
        </p>
      </header>

      <section className={styles.statsGrid}>
        <Card as='article' className={styles.stat}>
          <p className={styles.statText}>Total rules</p>
          <strong className={styles.statValue}>{blockRules?.length ?? 0}</strong>
        </Card>
        <Card as='article' className={styles.stat}>
          <p className={styles.statText}>Active rules</p>
          <strong className={styles.statValue}>{activeRuleCount}</strong>
        </Card>
        <Card as='article' className={styles.stat}>
          <p className={styles.statText}>Temporarily allowed</p>
          <strong className={styles.statValue}>{pausedRuleCount}</strong>
        </Card>
      </section>

      <Tabs
        className={styles.tabs}
        ariaLabel='Options sections'
        items={OPTIONS_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'preferences' ? (
        <section className={styles.section}>
          <SectionHeader title='Preferences' status={isSettingsLoading ? <span className={styles.subtle}>Loading…</span> : null} />
          <Card className={styles.settingsGrid}>
            <label className={styles.settingsLabel}>
              Theme
              <select
                className={styles.settingsInput}
                value={settings?.theme ?? 'light'}
                onChange={(event) => {
                  handleThemeChange(event.target.value as Theme);
                }}
                disabled={!settings}
              >
                <option value='light'>Light</option>
                <option value='dark'>Dark</option>
                <option value='mindful'>Mindful</option>
              </select>
            </label>

            <label className={styles.settingsLabel}>
              Hold to unblock (seconds)
              <input
                className={styles.settingsInput}
                type='number'
                min={3}
                max={99}
                value={settings?.holdDurationSeconds ?? 3}
                disabled={!settings}
                onChange={(event) => {
                  handleHoldDurationChange(Number(event.target.value));
                }}
              />
            </label>
          </Card>
        </section>
      ) : null}

      {activeTab === 'scheduling' ? (
        <section className={styles.section}>
          <SectionHeader title='Scheduling' status={isSettingsLoading ? <span className={styles.subtle}>Loading…</span> : null} />
          <Card className={styles.settingsGrid}>
            <label className={styles.checkboxLabel}>
              <input
                type='checkbox'
                checked={Boolean(settings?.schedule.enabled)}
                disabled={!settings}
                onChange={(event) => {
                  handleScheduleEnabledChange(event.target.checked);
                }}
              />
              Enable scheduled blocking
            </label>

            <div className={styles.settingsLabel}>
              Active days
              <div className={styles.dayGrid}>
                {SCHEDULE_DAY_LABELS.map((day, index) => (
                  <label key={day} className={styles.dayChip}>
                    <input
                      type='checkbox'
                      checked={Boolean(settings?.schedule.windows[0]?.days[index])}
                      disabled={!settings}
                      onChange={(event) => {
                        handleScheduleDayToggle(index, event.target.checked);
                      }}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <label className={styles.settingsLabel}>
              Start time
              <input
                className={styles.settingsInput}
                type='time'
                value={settings?.schedule.windows[0]?.start ?? '09:00'}
                disabled={!settings}
                onChange={(event) => {
                  handleScheduleWindowChange({ start: event.target.value });
                }}
              />
            </label>

            <label className={styles.settingsLabel}>
              End time
              <input
                className={styles.settingsInput}
                type='time'
                value={settings?.schedule.windows[0]?.end ?? '17:00'}
                disabled={!settings}
                onChange={(event) => {
                  handleScheduleWindowChange({ end: event.target.value });
                }}
              />
            </label>
          </Card>
        </section>
      ) : null}

      {activeTab === 'rules' ? (
        <section className={styles.section}>
          <SectionHeader title='Rules' status={isRulesLoading ? <span className={styles.subtle}>Syncing…</span> : null} />
          {!blockRules?.length ? (
            <Card className={styles.emptyState}>
              <p>No rules yet.</p>
              <p className={styles.subtle}>Add rules from the popup to start blocking distracting sites.</p>
            </Card>
          ) : (
            <ul className={styles.rulesList}>{blockRules.map(renderRule)}</ul>
          )}
        </section>
      ) : null}
    </main>
  );
};

export default OptionsApp;
