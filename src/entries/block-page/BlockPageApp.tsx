import clsx from 'clsx';
import { useMemo } from 'react';

import styles from './BlockPageApp.module.css';
import BlockPageButton from './components/BlockPageButton';
import useBlockPageParams from './hooks/useBlockPageParams';
import useButtonEvents from './hooks/useButtonEvents';

import TitleDark from '@/assets/icons/title-dark.svg?react';
import TitleLight from '@/assets/icons/title-light.svg?react';
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

const BlockPageApp = () => {
  const theme = useThemeEffect();
  const { onMouseDown, onKeyDown, timeRemaining, timeTotal, held } = useButtonEvents();
  const { ruleIds, targetUrl } = useBlockPageParams();
  const { settings, updateSettings } = useSettings();

  const TitleImage = theme?.endsWith('dark') ? TitleLight : TitleDark;

  const holdIsComplete = useMemo(() => timeRemaining === 0, [timeRemaining]);

  /** Executes window.location.replace on hold completion */
  useNavigateOnUnblock(ruleIds, targetUrl, holdIsComplete);

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
          <strong>If you wish to proceed, hold the button.</strong>
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
            onSelectReview={handleSelectReview}
          />
        ) : null}
      </Stack>
      <Stack className={clsx(styles.absStack, styles.absStackRight)}>
        <TitleImage className={styles.titleImage} />
      </Stack>
      <BackgroundCredit theme={theme} />
    </Stack>
  );
};

export default BlockPageApp;
