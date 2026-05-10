import type { KeyboardEventHandler, MouseEventHandler } from 'react';
import { useCallback, useEffect, useState } from 'react';

import useHoldTimer from '@/entries/block-page/hooks/useHoldTimer';

const useButtonEventHandlers = (timeTotal: number | null) => {
  const [held, setHeld] = useState(false);
  const { timeRemaining, start, stop, reset } = useHoldTimer(timeTotal);
  const onMouseDown: MouseEventHandler = (e) => {
    if (e.button !== 0) {
      return;
    }
    setHeld(true);
    start();
  };

  const onKeyDown: KeyboardEventHandler = (e) => {
    if ((e.key === ' ' || e.code === 'Space') && !held) {
      setHeld(true);
      start();
    }
  };

  const onRelease = useCallback(() => {
    setHeld(false);
    stop();
    if (timeRemaining && timeRemaining > 0) {
      reset();
    }
  }, [timeRemaining, stop, reset]);

  useEffect(() => {
    document.addEventListener('pointerup', onRelease);
    document.addEventListener('keyup', onRelease);
    return () => {
      document.removeEventListener('pointerup', onRelease);
      document.removeEventListener('keyup', onRelease);
    };
  }, [onRelease]);

  return { onMouseDown, onKeyDown, held, timeRemaining, resetTimer: reset };
};

export default useButtonEventHandlers;
