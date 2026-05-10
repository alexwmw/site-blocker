import { useCallback, useState } from 'react';

import { MessagesService } from '@/services/MessagesService';

const MAX_RETRY_COUNT = 5;

const RETRY_TIMEOUT_MS = 1000;

const useNavigateOnUnblock = (ruleIds: string[] | null, targetUrl: string | null) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const testAndProceedToTargetUrl = useCallback(async () => {
    if (targetUrl) {
      const response = await MessagesService.sendMessage({
        type: 'TEST_URL_REQUEST',
        payload: { targetUrl },
      });

      if (response.status === 'unblocked') {
        window.location.replace(targetUrl);
      }
      return response.status;
    }
  }, [targetUrl]);

  const proceedToTargetUrl = useCallback(async () => {
    if (!ruleIds || !targetUrl || isNavigating || retryCount === MAX_RETRY_COUNT) {
      return;
    }
    setIsNavigating(true);
    const response = await MessagesService.sendMessage({
      type: 'UNBLOCK_REQUEST',
      payload: { ruleIds, targetUrl },
    });
    if (response.ok) {
      window.location.replace(targetUrl);
      setRetryCount(0);
    } else {
      setRetryCount((count) => count + 1);
      setErrorMessage(response.reason);
      setTimeout(() => {
        setIsNavigating(false);
      }, RETRY_TIMEOUT_MS);
    }
  }, [ruleIds, targetUrl, isNavigating, retryCount]);

  return {
    proceedToTargetUrl,
    testAndProceedToTargetUrl,
    isNavigating,
    error: retryCount === MAX_RETRY_COUNT && errorMessage,
  };
};
export default useNavigateOnUnblock;
