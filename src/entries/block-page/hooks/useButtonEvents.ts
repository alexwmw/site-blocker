import type { KeyboardEventHandler, MouseEventHandler } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import useSettings from '@/hooks/useSettings';

export const useButtonEvents = () => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [held, setHeld] = useState<boolean>(false);
  const interval = useRef<NodeJS.Timeout | null>(null);

  const { settings } = useSettings();

  const countdown = () => {
    setTimeRemaining((t: number | null) => {
      if (t === null) {
        return null;
      }
      return t > 0 ? t - 1 : 0;
    });
  };

  const onButtonPress = () => {
    if (!settings) {
      return;
    }

    if (interval.current) {
      return;
    }

    setTimeRemaining(settings.holdDurationSeconds);
    setHeld(true);
    interval.current = setInterval(countdown, 1000);
  };

  const onMouseDown: MouseEventHandler = (e) => {
    // left click only
    if (e.button !== 0) {
      return;
    }
    onButtonPress();
  };

  const onKeyDown: KeyboardEventHandler = (e) => {
    const spacerBarPress = e.key === ' ' || e.code === 'Space';
    if (!spacerBarPress || held) {
      return;
    }
    onButtonPress();
  };

  const onRelease = useCallback(() => {
    setTimeRemaining(null);
    setHeld(false);
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
  }, []);

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
