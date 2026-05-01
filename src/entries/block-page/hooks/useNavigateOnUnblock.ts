import { useCallback, useEffect, useRef, useState } from 'react';

import { MessagesService } from '@/services/MessagesService';

type Phase = 'idle' | 'cooldown' | 'ready' | 'navigated';

const useNavigateOnUnblock = (
  ruleIds: string[] | null,
  targetUrl: string | null,
  isUnblocked: boolean,
  held: boolean,
) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const timeoutRef = useRef<number | null>(null);

  const navigate = useCallback((url: string) => {
    setPhase((prev) => {
      if (prev === 'navigated') {
        return prev;
      }
      window.location.replace(url);
      return 'navigated';
    });
  }, []);

  const testIfAllowed = useCallback(async () => {
    if (!targetUrl) {
      return false;
    }

    const { ok, status } = await MessagesService.sendMessage({
      type: 'TEST_URL_REQUEST',
      payload: { targetUrl },
    });

    return ok && status !== 'blocked';
  }, [targetUrl]);

  const requestUnblock = useCallback(async () => {
    if (!ruleIds || !targetUrl) {
      return false;
    }

    const res = await MessagesService.sendMessage({
      type: 'UNBLOCK_REQUEST',
      payload: { ruleIds, targetUrl },
    });

    return res.ok;
  }, [ruleIds, targetUrl]);

  // 🔁 Reset on input change
  useEffect(() => {
    setPhase('idle');

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [targetUrl, ruleIds]);

  // ✅ Initial + visibility check (navigate immediately if already allowed)
  useEffect(() => {
    if (!targetUrl || phase === 'navigated') {
      return;
    }

    const check = () => {
      testIfAllowed()
        .then((allowed) => {
          if (allowed) {
            navigate(targetUrl);
          }
        })
        .catch(console.error);
    };

    check();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [targetUrl, testIfAllowed, navigate, phase]);

  // ⏱️ Timer finished → start 1s cooldown
  useEffect(() => {
    if (!isUnblocked || phase !== 'idle') {
      return;
    }

    setPhase('cooldown');

    timeoutRef.current = window.setTimeout(() => {
      setPhase('ready');
      timeoutRef.current = null;
    }, 1000);
  }, [isUnblocked, phase]);

  // 🚀 After cooldown + release → unblock → navigate
  useEffect(() => {
    if (!targetUrl) {
      return;
    }
    if (phase !== 'ready') {
      return;
    }
    if (held) {
      return;
    }

    (async () => {
      const ok = await requestUnblock();
      if (ok) {
        navigate(targetUrl);
      }
    })().catch(console.error);
  }, [phase, held, targetUrl, requestUnblock, navigate]);

  // 🧹 Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};

export default useNavigateOnUnblock;
