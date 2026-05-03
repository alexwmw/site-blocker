import { useCallback, useState } from 'react';

import { MessagesService } from '@/services/MessagesService';

const useNavigateOnUnblock = (ruleIds: string[] | null, targetUrl: string | null) => {
  const [isNavigating, setIsNavigating] = useState(false);

  const testTargetUrl = useCallback(async () => {
    if (targetUrl) {
      const response = await MessagesService.sendMessage({
        type: 'TEST_URL_REQUEST',
        payload: { targetUrl },
      });

      return response.status;
    }
  }, [targetUrl]);

  const proceedToTargetUrl = useCallback(async () => {
    if (!ruleIds || !targetUrl || isNavigating) {
      return;
    }
    setIsNavigating(true);
    const response = await MessagesService.sendMessage({
      type: 'UNBLOCK_REQUEST',
      payload: { ruleIds, targetUrl },
    });
    if (response.ok) {
      window.location.replace(targetUrl);
    } else {
      setIsNavigating(false);
    }
  }, [ruleIds, targetUrl, isNavigating]);

  return { proceedToTargetUrl, testTargetUrl, isNavigating };
};
export default useNavigateOnUnblock;
