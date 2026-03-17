import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EyebrowLabel from '../../components/ui/EyebrowLabel';
import SectionHeader from '../../components/ui/SectionHeader';
import useBlockRules from '../../hooks/useBlockRules';
import useCreateRuleFromTab from '../../hooks/useCreateRuleFromTab';
import useSettings from '../../hooks/useSettings';
import { RulesService } from '../../services/RulesService';
import { SchedulingService } from '../../services/SchedulingService';

import styles from './PopupApp.module.css';

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
  const { activeTab, url, isSupported, createDomainPrefixRule, createPrefixUrlRule } = useCreateRuleFromTab();
  const { blockRules, addRule, isLoading: isRulesLoading } = useBlockRules();
  const { settings, isLoading: isSettingsLoading } = useSettings();

  const now = Date.now();
  const matchingRules = url && blockRules ? RulesService.findMatchingRules(url, blockRules) : [];
  const matchingTemporarilyUnblockedRules = matchingRules.filter((rule) => (rule.unblockUntil ?? 0) > now);
  const activeBlockingRules = matchingRules.filter((rule) => (rule.unblockUntil ?? 0) <= now);

  const isScheduleEnabled = Boolean(settings?.schedule.enabled);
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
        <EyebrowLabel>Site Blocker</EyebrowLabel>
        <h1 className={styles.heroTitle}>Active page status</h1>
        <p className={styles.subtle}>{activeTab?.url ?? 'No active tab found.'}</p>
      </header>

      <Card as='section' className={styles.section}>
        <SectionHeader title='Blocking' />
        <ul className={styles.statusList}>
          <li>
            Blocked by rule:{' '}
            <strong className={isBlockedNow ? styles.warning : styles.positive}>{isBlockedNow ? 'Yes' : 'No'}</strong>
          </li>
          <li>
            Scheduling enabled:{' '}
            <strong>{isScheduleEnabled ? 'Yes' : 'No'}</strong>
          </li>
          {notBlockedReason ? <li>{notBlockedReason}</li> : null}
          {nextUnblockExpiration ? (
            <li>
              Temporary unblock remaining: <strong>{formatRemainingTime(nextUnblockExpiration - now)}</strong>
            </li>
          ) : null}
          {isRulesLoading || isSettingsLoading ? <li>Loading latest settings…</li> : null}
        </ul>
      </Card>

      <Card as='section' className={styles.section}>
        <SectionHeader title='Quick actions' />
        <div className={styles.actions}>
          <Button disabled={!canAddRule} onClick={handleAddDomainClick}>
            Add domain
          </Button>
          <Button variant='secondary' disabled={!canAddRule} onClick={handleAddPathClick}>
            Add page
          </Button>
        </div>
        <Button variant='ghost' className={styles.optionsButton} onClick={handleOpenOptions}>
          Manage rules in options
        </Button>
      </Card>
    </main>
  );
};

export default PopupApp;
