import { useCallback, useEffect, useState } from 'react';

import type { StorageListener } from '@/services/StorageService';
import { StorageService, type AddRuleResult } from '@/services/StorageService';
import type { BlockRule } from '@/types/schema';
import { blockRulesSchema } from '@/types/schema';

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
      setBlockRules(null);
      setError(toError(loadError));
    }
  }, []);

  useEffect(() => {
    loadBlockRules().catch(console.error);

    const listener: StorageListener = (changes) => {
      if (changes.rules) {
        const validated = blockRulesSchema.safeParse(changes.rules.newValue);

        if (!validated.success) {
          const changeError = validated.error;
          console.error(changeError);
          setBlockRules(null);
          setError(changeError);
          return;
        }

        setBlockRules(validated.data);
        setError(null);
      }
    };

    StorageService.addListener(listener);

    return () => StorageService.removeListener(listener);
  }, [loadBlockRules]);

  const addRule = async (rule: BlockRule): Promise<AddRuleResult> => {
    return StorageService.addRule(rule);
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
