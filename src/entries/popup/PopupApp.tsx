import clsx from 'clsx';
import { Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

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
import useTabUrlInfo from '@/entries/popup/useTabUrlInfo';
import useBlockRules from '@/hooks/useBlockRules';
import useCreateRuleFromTab from '@/hooks/useCreateRuleFromTab';
import useSettings from '@/hooks/useSettings';
import useThemeEffect from '@/hooks/useThemeEffect';
import { MessagesService } from '@/services/MessagesService';
import { getOptionsPageUrl } from '@/utils/extensionUrls';

const PopupApp = () => {
  useThemeEffect();
  const { activeTab, createDomainPrefixRule, createExactUrlRule, error: activeTabError, isResolved } = useCreateRuleFromTab();
  const { blockRules, addRule, error: blockRulesError } = useBlockRules();
  const { settings, error: settingsError } = useSettings();

  const [matchingRuleIds, setMatchingRuleIds] = useState<string[]>([]);
  const [matchingTemporarilyUnblockedRuleIds, setMatchingTemporarilyUnblockedRuleIds] = useState<string[]>([]);
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(false);
  const [isBlockingTime, setIsBlockingTime] = useState(true);
  const [siteIdentity, setSiteIdentity] = useState<{ host: string | null; path: string; label: string; faviconSources: string[] }>({ host: null, path: '', label: 'Unknown site', faviconSources: [] });

  const popupData = blockRules && settings && isResolved ? { activeTab, blockRules, settings } : null;
  const { isSupported, isExtensionPageUrl, domain, path } = useTabUrlInfo(activeTab);

  useEffect(() => {
    MessagesService.sendMessage({
      type: 'GET_POPUP_STATE_REQUEST',
      payload: { url: activeTab?.url, favIconUrl: activeTab?.favIconUrl ?? null },
    })
      .then((response) => {
        if (!response.ok) return;
        setMatchingRuleIds(response.matchingRuleIds);
        setMatchingTemporarilyUnblockedRuleIds(response.matchingTemporarilyUnblockedRuleIds);
        setIsScheduleEnabled(response.isScheduleEnabled);
        setIsBlockingTime(response.isBlockingTime);
        setSiteIdentity(response.siteIdentity);
      })
      .catch(console.error);
  }, [activeTab, blockRules, settings]);

  const matchingRulesCount = matchingRuleIds.length;
  const notBlockedReason = !isSupported
    ? { text: 'This URL type cannot be blocked' }
    : matchingTemporarilyUnblockedRuleIds.length > 0
      ? { text: 'This page is temporarily unblocked' }
      : isScheduleEnabled && !isBlockingTime
        ? { text: 'This page matches a rule, but blocking is currently outside your schedule', icon: 'Clock' }
        : matchingRulesCount > 0
          ? { text: 'This page is temporarily unblocked' }
          : null;

  const canAddRule = Boolean(activeTab && isSupported && matchingRulesCount === 0);

  const handleAddDomainClick = () => {
    const rule = createDomainPrefixRule();
    if (rule) addRule(rule).catch(console.error);
  };

  const handleAddPathClick = () => {
    const rule = createExactUrlRule();
    if (rule) addRule(rule).catch(console.error);
  };

  return (
    <main className={styles.page}>
      <div className={styles.headerBar}><Hero title='Active page status' label='Hold' variant='compact' /><div><Button onClick={() => chrome.runtime.openOptionsPage().catch(console.error)} variant='invisible'><Settings /></Button></div></div>
      <RenderBoundary data={popupData} error={activeTabError ?? blockRulesError ?? settingsError}>
        {!isExtensionPageUrl ? <div className={styles.activePageIdentity}><SiteIdentity identity={siteIdentity} size='small' /></div> : null}
        <Stack topMargin>
          {notBlockedReason ? <InfoItem tone='good' text={notBlockedReason.text} iconName={notBlockedReason.icon as IconName} /> : null}
          <Card padding as='section' className={styles.flexColumn}>
            <SectionHeader title='Quick actions' />
            <Button disabled={!canAddRule} onClick={handleAddDomainClick} className={clsx(styles.optionsButton, styles.primary)}>Block this site</Button>
            {domain !== path ? <Button variant='secondary' disabled={!canAddRule} onClick={handleAddPathClick} className={styles.optionsButton}><div className={styles.optionsButtonText}><div> Block this specific page</div><div className={styles.cleanedRulePreview}>{path}</div></div></Button> : null}
            {blockRules && blockRules.length > 0 ? <Button variant='ghost' className={styles.optionsButton} onClick={() => chrome.runtime.openOptionsPage().catch(console.error)}>Manage blocking rules</Button> : null}
            <Button variant='ghost' className={styles.optionsButton} onClick={() => window.open(getOptionsPageUrl() + '?tabId=scheduling', 'scheduling')}>
              {isScheduleEnabled ? 'Edit schedule' : 'Create a blocking schedule'}
            </Button>
          </Card>
        </Stack>
      </RenderBoundary>
    </main>
  );
};

export default PopupApp;
