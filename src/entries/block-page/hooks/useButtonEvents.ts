import type { KeyboardEventHandler, MouseEventHandler } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import useSettings from '@/hooks/useSettings';

export const useHoldTimer = (duration: number | null) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const interval = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (!duration || interval.current) {
      return;
    }

    setTimeRemaining(duration);
    interval.current = setInterval(() => {
      setTimeRemaining((t) => (t && t > 0 ? t - 1 : 0));
    }, 1000);
  }, [duration]);

  const stop = useCallback(() => {
    setTimeRemaining(null);
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
  }, []);

  return { timeRemaining, start, stop };
};

export const useButtonEvents = () => {
  const { settings } = useSettings();
  const { timeRemaining, start, stop } = useHoldTimer(settings?.holdDurationSeconds ?? null);

  const [held, setHeld] = useState(false);

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
  }, [stop]);

  useEffect(() => {
    document.addEventListener('mouseup', onRelease);
    document.addEventListener('keyup', onRelease);
    return () => {
      document.removeEventListener('mouseup', onRelease);
      document.removeEventListener('keyup', onRelease);
    };
  }, [onRelease]);

  return { onMouseDown, onKeyDown, timeRemaining, timeTotal: settings?.holdDurationSeconds, held };
};

export default useButtonEvents;
