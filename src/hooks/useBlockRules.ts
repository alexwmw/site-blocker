import { useCallback, useEffect, useState } from 'react';

import type { StorageListener } from '@/services/StorageService';
import { StorageService } from '@/services/StorageService';
import type { BlockRule } from '@/types/schema';

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)));

const useBlockRules = () => {
  const [blockRules, setBlockRules] = useState<BlockRule[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadBlockRules = useCallback(async () => {
    try {
      const nextBlockRules = await StorageService.getRules();
      setBlockRules(nextBlockRules);
      setError(null);
    } catch (loadError) {
      console.error(loadError);
      setError(toError(loadError));
    }
  }, []);

  useEffect(() => {
    loadBlockRules().catch(console.error);

    const listener: StorageListener = (changes) => {
      if (changes.rules) {
        setBlockRules(changes.rules.newValue as BlockRule[]);
        setError(null);
      }
    };

    StorageService.addListener(listener);

    return () => StorageService.removeListener(listener);
  }, [loadBlockRules]);

  const addRule = async (rule: BlockRule) => {
    await StorageService.addRule(rule);
  };

  const removeRule = async (id: string) => {
    await StorageService.removeRule(id);
  };

  const updateRule = async (id: string, updates: Partial<BlockRule>) => {
    await StorageService.updateRule(id, updates);
  };

  return {
    blockRules,
    error,
    addRule,
    removeRule,
    updateRule,
  };
};

export default useBlockRules;
