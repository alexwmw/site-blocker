import { useEffect } from 'react';

import type { RuntimeRequest } from '../types/messages';

const useRequest = (request: RuntimeRequest) => {
  useEffect(() => {
    if (request) {
      chrome.runtime.sendMessage(request).catch(console.error);
    }
  }, [request]);
};

export default useRequest;
