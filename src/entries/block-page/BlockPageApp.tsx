import type { LottieRefCurrentProps } from 'lottie-react';
import { useMemo, useRef } from 'react';

import styles from './BlockPageApp.module.css';
import BlockPageButton from './BlockPageButton';
import useBlockPageParams from './useBlockPageParams';
import useButtonEvents from './useButtonEvents';
import useNavigateOnUnblock from './useNavigateOnUnblock';

import BackgroundCredit from '@/components/ui/BackgroundCredit';
import Card from '@/components/ui/Card';
import EyebrowLabel from '@/components/ui/EyebrowLabel';
import useSettings from '@/hooks/useSettings';
import useThemeEffect from '@/hooks/useThemeEffect';

const BlockPageApp = () => {
  const theme = useThemeEffect();
  const player = useRef<LottieRefCurrentProps>(null);
  const { onMouseDown, onKeyDown, timeRemaining, timeTotal } = useButtonEvents(player);
  const { ruleIds, targetUrl, patternHost, patternPath, matchType } = useBlockPageParams();
  const { settings } = useSettings();

  const holdIsComplete = timeRemaining === 0;

  /** Executes window.location.replace on hold completion */
  useNavigateOnUnblock(ruleIds, targetUrl, holdIsComplete);

  const urlLabel = useMemo(() => {
    if (!targetUrl) {
      return 'Unknown target';
    }
    try {
      return new URL(targetUrl).hostname;
    } catch {
      return targetUrl;
    }
  }, [targetUrl]);

  return (
    <main
      id='block-page'
      className={styles.page}
    >
      <Card
        as='section'
        className={styles.blockedCard}
      >
        <EyebrowLabel>Hold to Unblock</EyebrowLabel>
        <h1 className={styles.title}>{settings?.blockPageHeadline ?? 'Stay on track'}</h1>
        <p className={styles.subtitle}>
          You tried to open <strong>{urlLabel}</strong>. This page is blocked by your focus rules.
        </p>
        <p>
          <strong>If you wish to proceed, hold the button.</strong>
        </p>
        <dl className={styles.details}>
          <div className={styles.detailsItem}>
            <dt className={styles.detailTerm}>Match type</dt>
            <dd className={styles.detailValue}>{matchType ?? 'Not provided'}</dd>
          </div>
          <div className={styles.detailsItem}>
            <dt className={styles.detailTerm}>Rule host</dt>
            <dd className={styles.detailValue}>{patternHost ?? 'Not provided'}</dd>
          </div>
          <div className={styles.detailsItem}>
            <dt className={styles.detailTerm}>Rule path</dt>
            <dd className={styles.detailValue}>{patternPath ?? 'Not provided'}</dd>
          </div>
        </dl>

        <p className={styles.holdHelp}>
          Hold for {timeTotal ?? '...'} seconds to continue. Releasing early will reset the timer.
        </p>

        <BlockPageButton
          autoFocus
          player={player}
          remainingTime={timeRemaining}
          onMouseDown={onMouseDown}
          onKeyDown={onKeyDown}
        />
      </Card>
      <BackgroundCredit theme={theme} />
    </main>
  );
};

export default BlockPageApp;
