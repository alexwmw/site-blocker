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
    <div>
      <h1>Block Page</h1>
      <p>{targetUrl}</p>
      <p>Hold for {timeTotal} seconds</p>
      <BlockPageButton
        player={player}
        remainingTime={timeRemaining}
        onMouseDown={onMouseDown}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};

export default BlockPageApp;
