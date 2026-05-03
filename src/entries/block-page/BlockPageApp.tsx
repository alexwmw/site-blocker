import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';

import styles from './BlockPageApp.module.css';
import BlockPageButton from './components/BlockPageButton';
import useBlockPageParams from './hooks/useBlockPageParams';
import useButtonEventHandlers from './hooks/useButtonEventHandlers';

import TitleDark from '@/assets/icons/title-dark.svg?react';
import TitleLight from '@/assets/icons/title-light.svg?react';
import Card from '@/components/primitives/Card';
import Stack from '@/components/primitives/Stack';
import EyebrowLabel from '@/components/shared/EyebrowLabel';
import SiteIdentity from '@/components/shared/SiteIdentity';
import BackgroundCredit from '@/entries/block-page/components/BackgroundCredit';
import QuickOptions from '@/entries/block-page/components/QuickOptions';
import ReviewCard from '@/entries/block-page/components/ReviewCard';
import UpdatedBanner from '@/entries/block-page/components/UpdatedBanner';
import useNavigateOnUnblock from '@/entries/block-page/hooks/useNavigateOnUnblock';
import useSettings from '@/hooks/useSettings';
import useThemeEffect from '@/hooks/useThemeEffect';
import { SiteIdentityService } from '@/services/SiteIdentityService';
import { getChromeWebStoreUrl } from '@/utils/extensionUrls';

const BlockPageApp = () => {
  const theme = useThemeEffect();
  const { settings, updateSettings } = useSettings();
  const timeTotal = useMemo(() => settings?.holdDurationSeconds ?? null, [settings]);
  const { onMouseDown, onKeyDown, held, timeRemaining } = useButtonEventHandlers(timeTotal);
  const holdIsComplete = useMemo(() => timeRemaining === 0, [timeRemaining]);
  const { ruleIds, targetUrl } = useBlockPageParams();
  const [readyToProceed, setReadyToProceed] = useState<boolean>(false);

  const TitleImage = theme?.endsWith('dark') ? TitleLight : TitleDark;

  const { proceedToTargetUrl, testTargetUrl } = useNavigateOnUnblock(ruleIds, targetUrl);

  const targetIdentity = useMemo(() => SiteIdentityService.fromUrl(targetUrl), [targetUrl]);

  const handleSelectWebStoreButton = () => {
    window.open(getChromeWebStoreUrl(), '_blank');
  };

  const handleSelectReviewButton = () => {
    window.open(getChromeWebStoreUrl('reviews'), '_blank');
    updateSettings({ isRated: true }).catch(console.error);
  };

  const handleDontShowReviewCard = () => {
    updateSettings({ isRated: true }).catch(console.error);
  };

  const handleHideBanner = () => {
    updateSettings({ showMigrationBrief: false }).catch(console.error);
  };

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (holdIsComplete && !readyToProceed) {
      // UX delay
      t = setTimeout(() => {
        setReadyToProceed(true);
      }, 1000);
    }
    if (holdIsComplete && !held && readyToProceed) {
      proceedToTargetUrl().catch(console.error);
    }
    return () => {
      clearTimeout(t);
    };
  }, [holdIsComplete, proceedToTargetUrl, held, readyToProceed]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        testTargetUrl()
          .then((response) => {
            if (response === 'unblocked') {
              proceedToTargetUrl().catch(console.error);
            }
          })
          .catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [proceedToTargetUrl, testTargetUrl]);

  return (
    <Stack
      id='block-page'
      className={styles.page}
      as='main'
    >
      <Card
        as='section'
        className={styles.blockedCard}
      >
        <EyebrowLabel>Hold</EyebrowLabel>
        <h1 className={styles.title}>{settings?.blockPageHeadline ?? 'Stay on track'}</h1>
        <div className={styles.subtitle}>
          <p>This page is blocked by your focus rules:</p>
          <SiteIdentity
            size='large'
            identity={targetIdentity}
          />
        </div>
      </Card>
      <Card
        as='section'
        className={styles.blockedCard}
      >
        <p className={styles.holdInstruction}>
          {holdIsComplete && held && readyToProceed ? (
            <strong>You can let go now...</strong>
          ) : holdIsComplete ? (
            <strong>Navigating...</strong>
          ) : (
            <strong>If you wish to proceed, hold the button.</strong>
          )}
        </p>

        <p className={styles.holdHelp}>
          Hold for {timeTotal ?? '...'} seconds to continue. Releasing early will reset the timer.
        </p>

        <BlockPageButton
          autoFocus
          holdIsComplete={holdIsComplete}
          remainingTime={timeRemaining}
          onMouseDown={onMouseDown}
          onKeyDown={onKeyDown}
          animationDuration={timeTotal ?? 0}
          held={held}
        />
      </Card>
      <Stack className={clsx(styles.absStack, styles.absStackLeft)}>
        {settings ? (
          <QuickOptions
            className={styles.optionsCard}
            settings={settings}
            updateSettings={updateSettings}
          />
        ) : null}
        {!settings?.isRated ? (
          <ReviewCard
            onSelectDontShow={handleDontShowReviewCard}
            onSelectReview={handleSelectReviewButton}
          />
        ) : null}
      </Stack>
      <Stack className={clsx(styles.absStack, styles.absStackRight)}>
        {settings?.showMigrationBrief ? (
          <UpdatedBanner
            onSelectWebStoreLink={handleSelectWebStoreButton}
            onSelectDontShow={handleHideBanner}
          />
        ) : (
          <TitleImage className={styles.titleImage} />
        )}
      </Stack>
      <BackgroundCredit theme={theme} />
    </Stack>
  );
};

export default BlockPageApp;
