import { useEffect, useState } from 'react';

import { StorageService } from '../services/StorageService';
import type { BlockRule } from '../types/schema';

const useBlockRules = () => {
  const [blockRules, setBlockRules] = useState<BlockRule[] | null>(null);

  useEffect(() => {
    // Initial load
    StorageService.getRules().then(setBlockRules).catch(console.error);

    // Listen for Storage Changes
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      // If the 'rules' key was updated anywhere in the extension...
      if (changes.rules) {
        setBlockRules(changes.rules.newValue as BlockRule[]);
      }
    };

    StorageService.addListener(listener);

    // Clean up the listener when the component unmounts
    return () => StorageService.removeListener(listener);
  }, []);

  const addRule = async (rule: BlockRule) => {
    await StorageService.addRule(rule);
  };

  const removeRule = async (id: string) => {
    await StorageService.removeRule(id);
  };

  return {
    blockRules,
    addRule,
    removeRule,
    isLoading: blockRules === null,
  };
};

export default useBlockRules;
