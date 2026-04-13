import { useCallback, useEffect, useState } from 'react';

import { MessagesService } from '@/services/MessagesService';

const useNavigateOnUnblock = (ruleIds: string[] | null, targetUrl: string | null, isUnblocked: boolean) => {
  const [didNavigate, setDidNavigate] = useState<boolean>(false);

  const replaceLocation = useCallback(async () => {
    if (!ruleIds || !targetUrl) {
      return;
    }
    const response = await MessagesService.sendMessage({
      type: 'UNBLOCK_REQUEST',
      payload: { ruleIds, targetUrl },
    });
    if (response.ok) {
      window.location.replace(targetUrl);
      setDidNavigate(true);
    }
  }, [ruleIds, targetUrl]);

  useEffect(() => {
    if (targetUrl) {
      MessagesService.sendMessage({
        type: 'TEST_URL_REQUEST',
        payload: { targetUrl },
      })
        .then(({ ok, status }) => {
          if (ok && status !== 'blocked') {
            window.location.replace(targetUrl);
            setDidNavigate(true);
          }
        })
        .catch(console.error);
    }
    if (isUnblocked && !didNavigate) {
      setTimeout(() => {
        replaceLocation().catch(console.error);
      }, 1000);
    }
  }, [replaceLocation, isUnblocked, didNavigate, targetUrl]);

  return didNavigate;
};

export default useNavigateOnUnblock;
