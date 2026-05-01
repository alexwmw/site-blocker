import { useCallback, useRef, useState } from 'react';

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

export default useHoldTimer;