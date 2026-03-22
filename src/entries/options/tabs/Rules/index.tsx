import type { MouseEventHandler } from 'react';
import { useState } from 'react';

import styles from '../../OptionsApp.module.css';
import OptionsTab from '../OptionsTab';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Switch from '@/components/primitives/Switch';
import StatusItem from '@/components/shared/StatusItem';
import type { BlockRule, Schedule } from '@/types/schema';

type RulesProps = {
  blockRules: BlockRule[] | null;
  className: string;
  onClickEditSchedule: MouseEventHandler;
  removeRule: (id: string) => Promise<void>;
  schedule: Schedule | null;
  updateRule: (id: string, updates: Partial<BlockRule>) => Promise<void>;
};

const readableDate = (dateIso: string) => {
  const date = new Date(dateIso);
  return Number.isNaN(date.valueOf()) ? 'Unknown date' : date.toLocaleString();
};

const Rules = ({ blockRules, className, onClickEditSchedule, removeRule, schedule, updateRule }: RulesProps) => {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingMatchTypeRuleId, setPendingMatchTypeRuleId] = useState<string | null>(null);

  const handleRemove = async (ruleId: string) => {
    setPendingDeleteId(ruleId);
    try {
      await removeRule(ruleId);
    } finally {
      setPendingDeleteId(null);
    }
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
              id={rule.id + '-switch'}
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
    <OptionsTab
      title='Rules'
      className={className}
    >
      {schedule?.enabled ? (
        <div className={styles.statusGrid}>
          <StatusItem
            label='Scheduling is:'
            value='On'
            tone='bad'
          />
          <Button onClick={onClickEditSchedule}>Edit schedule</Button>
        </div>
      ) : null}
      {blockRules === null ? null : !blockRules.length ? (
        <Card className={styles.emptyState}>
          <p>No rules yet.</p>
          <p className={styles.subtle}>Add rules from the popup to start blocking distracting sites.</p>
        </Card>
      ) : (
        <ul className={styles.rulesList}>{blockRules.map(renderRule)}</ul>
      )}
    </OptionsTab>
  );
};

export default Rules;
