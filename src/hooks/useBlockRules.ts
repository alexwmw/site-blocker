import { useCallback, useEffect, useState } from 'react';

import { MessagesService } from '@/services/MessagesService';
import type { BlockRule } from '@/types/schema';

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)));

const useBlockRules = () => {
  const [blockRules, setBlockRules] = useState<BlockRule[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadBlockRules = useCallback(async () => {
    try {
      const response = await MessagesService.sendMessage({ type: 'GET_BLOCK_RULES_REQUEST' });
      if (!response.ok) {
        throw new Error(response.reason ?? 'Could not load block rules');
      }
      setBlockRules(response.blockRules);
      setError(null);
    } catch (loadError) {
      console.error(loadError);
      setBlockRules(null);
      setError(toError(loadError));
    }
  }, []);

  useEffect(() => {
    loadBlockRules().catch(console.error);
  }, [loadBlockRules]);

  const addRule = async (rule: BlockRule) => {
    const response = await MessagesService.sendMessage({ type: 'ADD_BLOCK_RULE_REQUEST', payload: { rule } });
    if (!response.ok) throw new Error(response.reason ?? 'Could not add rule');
    await loadBlockRules();
  };

  const removeRule = async (id: string) => {
    const response = await MessagesService.sendMessage({ type: 'REMOVE_BLOCK_RULE_REQUEST', payload: { id } });
    if (!response.ok) throw new Error(response.reason ?? 'Could not remove rule');
    await loadBlockRules();
  };

  const updateRule = async (id: string, updates: Partial<BlockRule>) => {
    const response = await MessagesService.sendMessage({ type: 'UPDATE_BLOCK_RULE_REQUEST', payload: { id, updates } });
    if (!response.ok) throw new Error(response.reason ?? 'Could not update rule');
    await loadBlockRules();
  };

  return { blockRules, error, addRule, removeRule, updateRule };
};

export default useBlockRules;
