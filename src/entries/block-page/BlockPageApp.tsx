import type { LottieRefCurrentProps } from 'lottie-react';
import { useMemo, useRef } from 'react';

import styles from './BlockPageApp.module.css';
import BlockPageButton from './components/BlockPageButton';
import useBlockPageParams from './hooks/useBlockPageParams';
import useButtonEvents from './hooks/useButtonEvents';
import useNavigateOnUnblock from './hooks/useNavigateOnUnblock';

import Card from '@/components/primitives/Card';
import EyebrowLabel from '@/components/shared/EyebrowLabel';
import SiteIdentity from '@/components/shared/SiteIdentity';
import BackgroundCredit from '@/entries/block-page/components/BackgroundCredit';
import useSettings from '@/hooks/useSettings';
import useThemeEffect from '@/hooks/useThemeEffect';
import { SiteIdentityService } from '@/services/SiteIdentityService';

const BlockPageApp = () => {
  const theme = useThemeEffect();
  const player = useRef<LottieRefCurrentProps>(null);
  const { onMouseDown, onKeyDown, timeRemaining, timeTotal } = useButtonEvents(player);
  const { ruleIds, targetUrl, patternHost, patternPath, matchType } = useBlockPageParams();
  const { settings } = useSettings();

  const holdIsComplete = timeRemaining === 0;

  /** Executes window.location.replace on hold completion */
  useNavigateOnUnblock(ruleIds, targetUrl, holdIsComplete);

  const targetIdentity = useMemo(() => SiteIdentityService.fromUrl(targetUrl, { faviconMode: 'page' }), [targetUrl]);
  const ruleIdentity = useMemo(
    () => SiteIdentityService.fromHostAndPath(patternHost, patternPath),
    [patternHost, patternPath],
  );

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
        <div className={styles.subtitle}>
          <SiteIdentity identity={targetIdentity} />
          <p>This page is blocked by your focus rules.</p>
        </div>
        <p>
          <strong>If you wish to proceed, hold the button.</strong>
        </p>
        <dl className={styles.details}>
          <div className={styles.detailsItem}>
            <dt className={styles.detailTerm}>Match type</dt>
            <dd className={styles.detailValue}>{matchType ?? 'Not provided'}</dd>
          </div>
          <div className={styles.detailsItem}>
            <dt className={styles.detailTerm}>Matched rule</dt>
            <dd className={styles.detailValue}>
              <SiteIdentity
                identity={ruleIdentity}
                size='small'
              />
            </dd>
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
