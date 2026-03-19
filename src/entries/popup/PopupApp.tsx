import { useEffect, useMemo, useState } from 'react';

import styles from './PopupApp.module.css';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EyebrowLabel from '@/components/ui/EyebrowLabel';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusItem from '@/components/ui/StatusItem';
import useBlockRules from '@/hooks/useBlockRules';
import useCreateRuleFromTab from '@/hooks/useCreateRuleFromTab';
import useSchedule from '@/hooks/useSchedule';
import useSettings from '@/hooks/useSettings';
import useThemeEffect from '@/hooks/useThemeEffect';
import { getBlockPageUrl } from '@/services/blocking/getBlockPageUrl';
import { RulesService } from '@/services/RulesService';
import { SchedulingService } from '@/services/SchedulingService';

const formatRemainingTime = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
};

const PopupApp = () => {
  useThemeEffect();
  const { activeTab, url, isSupported, createDomainPrefixRule, createPrefixUrlRule } = useCreateRuleFromTab();
  const { blockRules, addRule } = useBlockRules();
  const { settings } = useSettings();
  const { isScheduleEnabled } = useSchedule();
  const [tickNow, setTickNow] = useState(Date.now());

  const isBlockPageUrl = useMemo(() => Boolean(activeTab?.url?.startsWith(getBlockPageUrl())), [activeTab]);

  const matchingRules = useMemo(() => {
    return url && blockRules ? RulesService.findMatchingRules(url, blockRules) : [];
  }, [url, blockRules]);

  const matchingTemporarilyUnblockedRules = matchingRules.filter((rule) => (rule.unblockUntil ?? 0) > tickNow);
  const activeBlockingRules = matchingRules.filter((rule) => (rule.unblockUntil ?? 0) <= tickNow);

  const isBlockingTime = SchedulingService.isBlockingActiveNow(settings?.schedule);
  const isBlockedByRule = isSupported && activeBlockingRules.length > 0;
  const isBlockedNow = isBlockedByRule && isBlockingTime;

  const nextUnblockExpiration = matchingTemporarilyUnblockedRules.reduce<number | null>((soonest, rule) => {
    const value = rule.unblockUntil;
    if (!value) {
      return soonest;
    }
    if (!soonest || value < soonest) {
      return value;
    }
    return soonest;
  }, null);

  useEffect(() => {
    if (!nextUnblockExpiration) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTickNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [nextUnblockExpiration]);

  const notBlockedReason = (() => {
    if (!isSupported) {
      return 'This URL type is not supported by rules.';
    }
    if (matchingRules.length === 0) {
      return 'No matching rules for this page.';
    }
    if (matchingTemporarilyUnblockedRules.length > 0) {
      return 'This page matches a rule but is temporarily unblocked.';
    }
    if (isScheduleEnabled && !isBlockingTime) {
      return 'This page matches a rule, but blocking is currently outside your scheduled window.';
    }
    return null;
  })();

  const canAddRule = Boolean(activeTab && isSupported);

  const handleAddDomainClick = () => {
    const rule = createDomainPrefixRule();
    if (rule) {
      addRule(rule).catch(console.error);
    }
  };

  const handleAddPathClick = () => {
    const rule = createPrefixUrlRule();
    if (rule) {
      addRule(rule).catch(console.error);
    }
  };

  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage().catch(console.error);
  };

  return (
    <main className={styles.page}>
      <header>
        <EyebrowLabel>Hold</EyebrowLabel>
        <h1 className={styles.heroTitle}>Active page status</h1>
        {!isBlockPageUrl ? <p className={styles.subtle}>{activeTab?.url ?? 'No active tab found.'}</p> : null}
      </header>

      <Card
        as='section'
        className={styles.section}
      >
        <SectionHeader title='Blocking' />
        <dl className={styles.statusGrid}>
          <StatusItem
            label='Blocked by rule'
            value={isBlockedNow ? 'Yes' : 'No'}
            tone={isBlockedNow ? 'bad' : 'good'}
          />
          <StatusItem
            label='Scheduling enabled'
            value={isScheduleEnabled ? 'Yes' : 'No'}
            tone={isScheduleEnabled ? 'neutral' : 'good'}
          />
          <StatusItem
            label='URL supported'
            value={isSupported ? 'Yes' : 'No'}
            tone={isSupported ? 'good' : 'bad'}
          />
          {nextUnblockExpiration ? (
            <StatusItem
              label='Temporary unblock remaining'
              value={formatRemainingTime(nextUnblockExpiration - tickNow)}
              tone='neutral'
            />
          ) : null}
        </dl>

        {notBlockedReason ? <p className={styles.reasonBanner}>{notBlockedReason}</p> : null}
      </Card>

      <Card
        as='section'
        className={styles.section}
      >
        <SectionHeader title='Quick actions' />
        {!isBlockPageUrl ? (
          <div className={styles.actions}>
            <Button
              disabled={!canAddRule}
              onClick={handleAddDomainClick}
            >
              Add domain
            </Button>
            <Button
              variant='secondary'
              disabled={!canAddRule}
              onClick={handleAddPathClick}
            >
              Add page
            </Button>
          </div>
        ) : null}
        <Button
          variant='ghost'
          className={styles.optionsButton}
          onClick={handleOpenOptions}
        >
          Manage rules in options
        </Button>
      </Card>
    </main>
  );
};

export default PopupApp;
