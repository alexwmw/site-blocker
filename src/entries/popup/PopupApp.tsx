import { useEffect, useMemo, useState } from 'react';

import styles from './PopupApp.module.css';

import BrandMark from '@/components/branding/BrandMark';
import Button from '@/components/ui/Button';
import Callout from '@/components/ui/Callout';
import Card from '@/components/ui/Card';
import EyebrowLabel from '@/components/ui/EyebrowLabel';
import RenderBoundary from '@/components/ui/RenderBoundary';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusItem from '@/components/ui/StatusItem';
import useBlockRules from '@/hooks/useBlockRules';
import useCreateRuleFromTab from '@/hooks/useCreateRuleFromTab';
import useSettings from '@/hooks/useSettings';
import useThemeEffect from '@/hooks/useThemeEffect';
import { RulesService } from '@/services/RulesService';
import { SchedulingService } from '@/services/SchedulingService';
import { isExtensionUrl } from '@/utils/extensionUrls';

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
  const {
    activeTab,
    createDomainPrefixRule,
    createPrefixUrlRule,
    error: activeTabError,
    isResolved,
  } = useCreateRuleFromTab();
  const { blockRules, addRule, error: blockRulesError } = useBlockRules();
  const { settings, error: settingsError } = useSettings();
  const [tickNow, setTickNow] = useState(Date.now());

  const popupData = blockRules && settings && isResolved ? { activeTab, blockRules, settings } : null;
  const url = activeTab?.url ?? null;
  const isSupported = Boolean(url && RulesService.isSupportedUrl(url));
  const isExtensionPageUrl = isExtensionUrl(url);

  const matchingRules = useMemo(() => {
    return url && blockRules ? RulesService.findMatchingRules(url, blockRules) : [];
  }, [url, blockRules]);

  const matchingTemporarilyUnblockedRules = matchingRules.filter((rule) => (rule.unblockUntil ?? 0) > tickNow);
  const activeBlockingRules = matchingRules.filter((rule) => (rule.unblockUntil ?? 0) <= tickNow);

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
      return 'No matching rules for this page yet.';
    }
    if (matchingTemporarilyUnblockedRules.length > 0) {
      return 'This page matches a rule but is temporarily allowed.';
    }
    if (isScheduleEnabled && !isBlockingTime) {
      return 'This page matches a rule, but blocking is currently outside your scheduled window.';
    }
    return null;
  })();

  const canAddRule = Boolean(activeTab && isSupported);
  const showOnboarding = !isExtensionPageUrl && (blockRules?.length ?? 0) === 0;

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
      <header className={styles.header}>
        <BrandMark compact />
        <div className={styles.headerCopy}>
          <EyebrowLabel>Hold</EyebrowLabel>
          <h1 className={styles.heroTitle}>Active page status</h1>
          <p className={styles.heroText}>See whether this tab is protected and add the right amount of friction fast.</p>
        </div>
      </header>

      <RenderBoundary
        data={popupData}
        error={activeTabError ?? blockRulesError ?? settingsError}
      >
        {!isExtensionPageUrl ? <p className={styles.subtle}>{activeTab?.url ?? 'No active tab found.'}</p> : null}

        {showOnboarding ? (
          <Callout
            title='Good enough setup: block one distracting domain first.'
            className={styles.callout}
            action={
              <Button
                disabled={!canAddRule}
                onClick={handleAddDomainClick}
              >
                Add this domain
              </Button>
            }
          >
            <p>
              Start with a single rule for the site in front of you. You can refine exact pages and schedules later if
              you still need more structure.
            </p>
          </Callout>
        ) : null}

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

          {notBlockedReason ? (
            <Callout
              title={isBlockedNow ? 'Protection is active.' : 'What to know'}
              tone={matchingTemporarilyUnblockedRules.length > 0 || isScheduleEnabled ? 'warning' : 'info'}
              className={styles.reasonBanner}
            >
              <p>{notBlockedReason}</p>
            </Callout>
          ) : null}
        </Card>

        <Card
          as='section'
          className={styles.section}
        >
          <SectionHeader title='Quick actions' />
          {!isExtensionPageUrl ? (
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
      </RenderBoundary>
    </main>
  );
};

export default PopupApp;
