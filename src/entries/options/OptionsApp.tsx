import { useEffect, useMemo, useState } from 'react';

import useBlockRules from '../../hooks/useBlockRules';
import useSettings from '../../hooks/useSettings';
import type { BlockRule, Theme } from '../../types/schema';

const readableDate = (dateIso: string) => {
  const date = new Date(dateIso);
  return Number.isNaN(date.valueOf()) ? 'Unknown date' : date.toLocaleString();
};

const OptionsApp = () => {
  const { blockRules, removeRule, isLoading: isRulesLoading } = useBlockRules();
  const { settings, updateSettings, isLoading: isSettingsLoading } = useSettings();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const activeRuleCount = useMemo(
    () => blockRules?.filter((rule) => rule.enabled).length ?? 0,
    [blockRules],
  );


  useEffect(() => {
    if (settings?.theme) {
      document.documentElement.dataset.theme = settings.theme;
    }
  }, [settings?.theme]);

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

  const renderRule = (rule: BlockRule) => {
    const unblockState =
      rule.unblockUntil && rule.unblockUntil > Date.now()
        ? `Temporarily allowed until ${new Date(rule.unblockUntil).toLocaleTimeString()}`
        : 'Blocked now';

    return (
      <li
        key={rule.id}
        className='card rule-card'
      >
        <div>
          <p className='rule-pattern'>{rule.pattern}</p>
          <p className='rule-meta'>
            Match: <strong>{rule.matchType}</strong> · Added {readableDate(rule.createdAt)}
          </p>
          <p className='rule-meta'>{unblockState}</p>
        </div>
        <button
          className='danger-button'
          onClick={() => {
            handleRemove(rule.id).catch(console.error);
          }}
          disabled={pendingDeleteId === rule.id}
        >
          {pendingDeleteId === rule.id ? 'Removing…' : 'Remove'}
        </button>
      </li>
    );
  };

  return (
    <main className='options-page'>
      <header className='hero'>
        <p className='eyebrow'>Site Blocker</p>
        <h1>Focus controls</h1>
        <p className='subtle'>
          Keep your rules clear, adjust unblock friction, and tune the extension for long-term focus.
        </p>
      </header>

      <section className='stats-grid'>
        <article className='card stat'>
          <p>Total rules</p>
          <strong>{blockRules?.length ?? 0}</strong>
        </article>
        <article className='card stat'>
          <p>Active rules</p>
          <strong>{activeRuleCount}</strong>
        </article>
        <article className='card stat'>
          <p>Temporarily allowed</p>
          <strong>{pausedRuleCount}</strong>
        </article>
      </section>

      <section className='section'>
        <div className='section-header'>
          <h2>Preferences</h2>
          {isSettingsLoading ? <span className='subtle'>Loading…</span> : null}
        </div>
        <div className='card settings-grid'>
          <label>
            Theme
            <select
              value={settings?.theme ?? 'light'}
              onChange={(event) => {
                handleThemeChange(event.target.value as Theme);
              }}
              disabled={!settings}
            >
              <option value='light'>Light</option>
              <option value='dark'>Dark</option>
            </select>
          </label>

          <label>
            Hold to unblock (seconds)
            <input
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
        </div>
      </section>

      <section className='section'>
        <div className='section-header'>
          <h2>Rules</h2>
          {isRulesLoading ? <span className='subtle'>Syncing…</span> : null}
        </div>
        {!blockRules?.length ? (
          <div className='card empty-state'>
            <p>No rules yet.</p>
            <p className='subtle'>Add rules from the popup to start blocking distracting sites.</p>
          </div>
        ) : (
          <ul className='rules-list'>{blockRules.map(renderRule)}</ul>
        )}
      </section>
    </main>
  );
};

export default OptionsApp;
