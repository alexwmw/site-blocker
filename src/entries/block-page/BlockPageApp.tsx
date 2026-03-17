import type { LottieRefCurrentProps } from 'lottie-react';
import { useRef } from 'react';

import BlockPageButton from './BlockPageButton';
import useBlockPageParams from './useBlockPageParams';
import useButtonEvents from './useButtonEvents';
import useNavigateOnUnblock from './useNavigateOnUnblock';

const BlockPageApp = () => {
  const player = useRef<LottieRefCurrentProps>(null);
  const { onMouseDown, onKeyDown, timeRemaining, timeTotal } = useButtonEvents(player);
  const { ruleIds, targetUrl } = useBlockPageParams();

  const holdIsComplete = timeRemaining === 0;

  /** Executes window.location.replace on hold completion */
  useNavigateOnUnblock(ruleIds, targetUrl, holdIsComplete);

  return (
    <div className="block-page">
      <div className="block-page__card">
        <h1>Mindful Pause</h1>
        <p className="block-page__url">{targetUrl}</p>
        <p className="block-page__instructions">Hold for {timeTotal} seconds</p>
        <BlockPageButton
          player={player}
          remainingTime={timeRemaining}
          onMouseDown={onMouseDown}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
};

export default BlockPageApp;
