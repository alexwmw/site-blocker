import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';

import styles from './PopupApp.module.css';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Stack from '@/components/primitives/Stack';
import Hero from '@/components/shared/Hero';
import type { IconName } from '@/components/shared/InfoItem';
import InfoItem from '@/components/shared/InfoItem';
import RenderBoundary from '@/components/shared/RenderBoundary';
import SectionHeader from '@/components/shared/SectionHeader';
import SiteIdentity from '@/components/shared/SiteIdentity';
import StatusItem from '@/components/shared/StatusItem';
import useTabUrlInfo from '@/entries/popup/useTabUrlInfo';
import useBlockRules from '@/hooks/useBlockRules';
import useCreateRuleFromTab from '@/hooks/useCreateRuleFromTab';
import useSettings from '@/hooks/useSettings';
import useThemeEffect from '@/hooks/useThemeEffect';
import { RulesService } from '@/services/RulesService';
import { SchedulingService } from '@/services/SchedulingService';
import { SiteIdentityService } from '@/services/SiteIdentityService';
import { getOptionsPageUrl } from '@/utils/extensionUrls';

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

  const { url, isSupported, isExtensionPageUrl, domain, path } = useTabUrlInfo(activeTab);

  const matchingRules = useMemo(() => {
    return url && blockRules ? RulesService.findMatchingRules(url, blockRules) : [];
  }, [url, blockRules]);

  const matchingTemporarilyUnblockedRules = matchingRules.filter((rule) => (rule.unblockUntil ?? 0) > tickNow);

  const isScheduleEnabled = Boolean(settings?.schedule.enabled);
  const isBlockingTime = SchedulingService.isBlockingActiveNow(settings?.schedule);

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
      return { text: 'This URL type cannot be blocked' };
    }
    if (matchingTemporarilyUnblockedRules.length > 0) {
      return { text: 'This page is temporarily unblocked' };
    }
    if (isScheduleEnabled && !isBlockingTime) {
      return { text: 'This page matches a rule, but blocking is currently outside your schedule', icon: 'Clock' };
    }
    if (matchingRules.length > 0) {
      return { text: 'This page is temporarily unblocked' };
    }
    return null;
  })();

  const canAddRule = Boolean(activeTab && isSupported && matchingRules.length === 0);

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
  const handleOpenSchedule = () => {
    window.open(getOptionsPageUrl() + '?tabId=scheduling', 'scheduling');
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
          {notBlockedReason ? (
            <InfoItem
              tone='good'
              text={notBlockedReason.text}
              iconName={notBlockedReason.icon as IconName}
            />
          ) : null}
          {nextUnblockExpiration ? (
            <StatusItem
              label='Temporary unblock remaining'
              value={formatRemainingTime(nextUnblockExpiration - tickNow)}
              tone='neutral'
            />
          ) : null}

          <Card
            padding
            as='section'
            className={styles.flexColumn}
          >
            <SectionHeader title='Quick actions' />
            <Button
              disabled={!canAddRule}
              onClick={handleAddDomainClick}
              className={clsx(styles.optionsButton, styles.primary)}
            >
              Block this site
            </Button>
            {domain !== path ? (
              <Button
                variant='secondary'
                disabled={!canAddRule}
                onClick={handleAddPathClick}
                className={styles.optionsButton}
              >
                <div className={styles.optionsButtonText}>Block {path}</div>
              </Button>
            ) : null}
          </Card>
          <Card
            padding
            as='section'
          >
            <SectionHeader title='More options' />
            <Button
              variant='ghost'
              className={styles.optionsButton}
              onClick={handleOpenOptions}
            >
              Manage blocking rules
            </Button>
            <Button
              variant='ghost'
              className={styles.optionsButton}
              onClick={handleOpenSchedule}
            >
              {isScheduleEnabled ? 'Edit schedule' : 'Create a blocking schedule'}
            </Button>
          </Card>
        </Stack>
      </RenderBoundary>
    </main>
  );
};

export default PopupApp;
