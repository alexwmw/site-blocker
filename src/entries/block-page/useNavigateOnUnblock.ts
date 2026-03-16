import { useCallback, useEffect, useState } from 'react';

import { MessagesService } from '../../services/MessagesService';

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
    if (isUnblocked && !didNavigate) {
      replaceLocation().catch(console.error);
    }
  }, [replaceLocation, isUnblocked, didNavigate]);

  return didNavigate;
};

export default useNavigateOnUnblock;
