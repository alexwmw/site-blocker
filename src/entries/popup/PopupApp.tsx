import clsx from 'clsx';
import { Settings } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import styles from './PopupApp.module.css';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Stack from '@/components/primitives/Stack';
import Hero from '@/components/shared/Hero';
import InfoItem from '@/components/shared/InfoItem';
import RenderBoundary from '@/components/shared/RenderBoundary';
import SectionHeader from '@/components/shared/SectionHeader';
import SiteIdentity from '@/components/shared/SiteIdentity';
import StatusItem from '@/components/shared/StatusItem';
import { getNextChangeString } from '@/entries/popup/getScheduleStrings';
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
    createExactUrlRule,
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

  const scheduleInfoLabel = useMemo(
    () => getNextChangeString(settings?.schedule, isBlockingTime),
    [isBlockingTime, settings?.schedule],
  );

  const notBlockedReason: string | null = useMemo(() => {
    if (!isSupported) {
      return 'This URL type cannot be blocked';
    }
    if (matchingTemporarilyUnblockedRules.length > 0) {
      return 'This page is temporarily unblocked';
    }
    if (!isBlockingTime && matchingRules.length > 0) {
      return 'This page will be blocked when schedule starts';
    }
    return null;
  }, [isBlockingTime, isSupported, matchingRules.length, matchingTemporarilyUnblockedRules.length]);

  const canAddRule = Boolean(activeTab && isSupported && matchingRules.length === 0);

  const handleAddDomainClick = () => {
    const rule = createDomainPrefixRule();
    if (rule) {
      addRule(rule).catch(console.error);
    }
  };

  const handleAddPathClick = () => {
    const rule = createExactUrlRule();
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
      <div className={styles.headerBar}>
        <Hero
          title='Active page status'
          label='Hold'
          variant='compact'
        />
        <div>
          <Button
            onClick={handleOpenOptions}
            variant='invisible'
          >
            <Settings />
          </Button>
        </div>
      </div>

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
          <Stack gap='x-small'>
            {isScheduleEnabled && scheduleInfoLabel ? (
              <InfoItem
                tone='good'
                text={scheduleInfoLabel}
                iconName='Clock'
              />
            ) : null}
            {notBlockedReason ? (
              <InfoItem
                tone='good'
                text={notBlockedReason}
              />
            ) : null}
            {nextUnblockExpiration ? (
              <StatusItem
                label='Temporary unblock remaining'
                value={formatRemainingTime(nextUnblockExpiration - tickNow)}
                tone='neutral'
              />
            ) : null}
          </Stack>
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
                <div className={styles.optionsButtonText}>
                  <div> Block this specific page</div>
                  <div className={styles.cleanedRulePreview}>{path}</div>
                </div>
              </Button>
            ) : null}
            {blockRules && blockRules.length > 0 ? (
              <Button
                variant='ghost'
                className={styles.optionsButton}
                onClick={handleOpenOptions}
              >
                Manage blocking rules
              </Button>
            ) : null}
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
