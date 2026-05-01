import type { KeyboardEventHandler, MouseEventHandler } from 'react';
import { useCallback, useEffect, useState } from 'react';

const useButtonEventHandlers = (startTimer: () => void, stopTimer: () => void) => {
  const [held, setHeld] = useState(false);

  const onMouseDown: MouseEventHandler = (e) => {
    if (e.button !== 0) {
      return;
    }
    setHeld(true);
    startTimer();
  };

  const onKeyDown: KeyboardEventHandler = (e) => {
    if ((e.key === ' ' || e.code === 'Space') && !held) {
      setHeld(true);
      startTimer();
    }
  };

  const onRelease = useCallback(() => {
    setHeld(false);
    stopTimer();
  }, [stopTimer]);

  useEffect(() => {
    document.addEventListener('mouseup', onRelease);
    document.addEventListener('keyup', onRelease);
    return () => {
      document.removeEventListener('mouseup', onRelease);
      document.removeEventListener('keyup', onRelease);
    };
  }, [onRelease]);

  return { onMouseDown, onKeyDown, held };
};

export default useButtonEventHandlers;
