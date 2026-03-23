import { useEffect, useMemo, useState } from 'react';

import styles from './PopupApp.module.css';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Stack from '@/components/primitives/Stack';
import Hero from '@/components/shared/Hero';
import RenderBoundary from '@/components/shared/RenderBoundary';
import SectionHeader from '@/components/shared/SectionHeader';
import SiteIdentity from '@/components/shared/SiteIdentity';
import StatusItem from '@/components/shared/StatusItem';
import useBlockRules from '@/hooks/useBlockRules';
import useCreateRuleFromTab from '@/hooks/useCreateRuleFromTab';
import useSettings from '@/hooks/useSettings';
import useThemeEffect from '@/hooks/useThemeEffect';
import { RulesService } from '@/services/RulesService';
import { SchedulingService } from '@/services/SchedulingService';
import { SiteIdentityService } from '@/services/SiteIdentityService';
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
      <Hero
        title='Active page status'
        label='Hold'
        variant='compact'
      />

      <RenderBoundary
        data={popupData}
        error={activeTabError ?? blockRulesError ?? settingsError}
      >
        {!isExtensionPageUrl ? (
          <div className={styles.activePageIdentity}>
            <SiteIdentity
              identity={SiteIdentityService.fromUrl(activeTab?.url, {
                preferredFaviconUrl: activeTab?.favIconUrl ?? null,
              })}
              size='small'
            />
          </div>
        ) : null}
        <Stack topMargin>
          <Card
            padding
            as='section'
          >
            <SectionHeader title='Blocking' />
            <Stack gap='x-small'>
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
            </Stack>

            {notBlockedReason ? <p className={styles.reasonBanner}>{notBlockedReason}</p> : null}
          </Card>

          <Card
            padding
            as='section'
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
        </Stack>
      </RenderBoundary>
    </main>
  );
};

export default PopupApp;
