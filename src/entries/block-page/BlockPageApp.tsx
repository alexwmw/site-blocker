import type { LottieRefCurrentProps } from 'lottie-react';
import { useMemo, useRef } from 'react';

import useThemeEffect from '../../hooks/useThemeEffect';

import BlockPageButton from './BlockPageButton';
import useBlockPageParams from './useBlockPageParams';
import useButtonEvents from './useButtonEvents';
import useNavigateOnUnblock from './useNavigateOnUnblock';

const BlockPageApp = () => {
  useThemeEffect();
  const player = useRef<LottieRefCurrentProps>(null);
  const { onMouseDown, onKeyDown, timeRemaining, timeTotal } = useButtonEvents(player);
  const { ruleIds, targetUrl, patternHost, patternPath, matchType } = useBlockPageParams();

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
    <main className='block-page'>
      <section className='blocked-card'>
        <p className='eyebrow'>Hold to Unblock</p>
        <h1>Stay on track</h1>
        <p className='subtitle'>
          You tried to open <strong>{urlLabel}</strong>. This page is blocked by your focus rules.
        </p>

        <dl className='details'>
          <div>
            <dt>Match type</dt>
            <dd>{matchType ?? 'Not provided'}</dd>
          </div>
          <div>
            <dt>Rule host</dt>
            <dd>{patternHost ?? 'Not provided'}</dd>
          </div>
          <div>
            <dt>Rule path</dt>
            <dd>{patternPath ?? 'Not provided'}</dd>
          </div>
        </dl>

        <p className='hold-help'>
          Hold to continue for {timeTotal ?? '...'} seconds. Releasing early will reset the timer.
        </p>

        <BlockPageButton
          autoFocus
          player={player}
          remainingTime={timeRemaining}
          onMouseDown={onMouseDown}
          onKeyDown={onKeyDown}
        />
      </section>
    </main>
  );
};

export default BlockPageApp;
