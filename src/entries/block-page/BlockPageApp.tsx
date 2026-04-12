import type { LottieRefCurrentProps } from 'lottie-react';
import { useEffect, useMemo, useRef } from 'react';

import styles from './BlockPageApp.module.css';
import BlockPageButton from './components/BlockPageButton';
import useBlockPageParams from './hooks/useBlockPageParams';
import useButtonEvents from './hooks/useButtonEvents';

import Card from '@/components/primitives/Card';
import Stack from '@/components/primitives/Stack';
import EyebrowLabel from '@/components/shared/EyebrowLabel';
import SiteIdentity from '@/components/shared/SiteIdentity';
import BackgroundCredit from '@/entries/block-page/components/BackgroundCredit';
import QuickOptions from '@/entries/block-page/components/QuickOptions';
import ReviewCard from '@/entries/block-page/components/ReviewCard';
import useNavigateOnUnblock from '@/entries/block-page/hooks/useNavigateOnUnblock';
import useSettings from '@/hooks/useSettings';
import useThemeEffect from '@/hooks/useThemeEffect';
import { SiteIdentityService } from '@/services/SiteIdentityService';
import { getChromeWebStoreUrl } from '@/utils/extensionUrls';

const HOLD_ANIM_DEFAULT_DURATION = 5;

const BlockPageApp = () => {
  const theme = useThemeEffect();
  const player = useRef<LottieRefCurrentProps>(null);
  const { onMouseDown, onKeyDown, timeRemaining, timeTotal } = useButtonEvents(player);
  const { ruleIds, targetUrl } = useBlockPageParams();
  const { settings, updateSettings } = useSettings();

  const holdIsComplete = useMemo(() => timeRemaining === 0, [timeRemaining]);

  const holdSpeed = useMemo(() => (timeTotal ? HOLD_ANIM_DEFAULT_DURATION / timeTotal : 1), [timeTotal]);

  /** Executes window.location.replace on hold completion */
  useNavigateOnUnblock(ruleIds, null, holdIsComplete);

  const targetIdentity = useMemo(() => SiteIdentityService.fromUrl(targetUrl), [targetUrl]);

  const handleSelectReview = () => {
    const targetUrl = getChromeWebStoreUrl('reviews');
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }
    updateSettings({ isRated: true }).catch(console.error);
  };

  const handleDontShowReviewCard = () => {
    updateSettings({ isRated: true }).catch(console.error);
  };

  useEffect(() => {
    if (holdIsComplete) {
      player.current?.setSpeed(1);
    } else {
      player.current?.setSpeed(holdSpeed);
    }
  }, [player, holdSpeed, holdIsComplete]);

  return (
    <main
      id='block-page'
      className={styles.page}
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
        <p>
          <strong>If you wish to proceed, hold the button.</strong>
        </p>

        <p className={styles.holdHelp}>
          Hold for {timeTotal ?? '...'} seconds to continue. Releasing early will reset the timer.
        </p>

        <BlockPageButton
          autoFocus
          player={player}
          holdIsComplete={holdIsComplete}
          remainingTime={timeRemaining}
          onMouseDown={onMouseDown}
          onKeyDown={onKeyDown}
        />
      </Card>
      <Stack className={styles.absStack}>
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
            onSelectReview={handleSelectReview}
          />
        ) : null}
      </Stack>
      <BackgroundCredit theme={theme} />
    </main>
  );
};

export default BlockPageApp;
