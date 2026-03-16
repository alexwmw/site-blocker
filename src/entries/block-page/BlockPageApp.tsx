import type { LottieRefCurrentProps } from 'lottie-react';
import { useEffect, useRef } from 'react';

import useBlockPageParams from '../../hooks/useBlockPageParams';
import { MessagesService } from '../../services/MessagesService';

import BlockPageButton from './BlockPageButton';
import useButtonEvents from './useButtonEvents';

const BlockPageApp = () => {
  const { ruleIds, targetUrl } = useBlockPageParams();
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const { onMouseDown, onKeyDown, complete, timeRemaining, timeTotal } = useButtonEvents(lottieRef);

  useEffect(() => {
    if (complete && ruleIds && targetUrl) {
      MessagesService.sendMessage({
        type: 'UNBLOCK_REQUEST',
        payload: { ruleIds, targetUrl },
      }).catch(console.error);
    }
  }, [complete, ruleIds, targetUrl]);

  return (
    <div>
      <h1>Block Page</h1>
      <p>Hold for {timeTotal} seconds</p>
      <BlockPageButton
        player={lottieRef}
        remainingTime={timeRemaining}
        onMouseDown={onMouseDown}
        onKeyDown={onKeyDown}
        holdComplete={complete}
      />
    </div>
  );
};

export default BlockPageApp;
