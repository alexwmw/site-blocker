import { useCallback, useEffect, useState } from 'react';

import { RulesService } from '@/services/RulesService';
import type { BlockRule, MatchType } from '@/types/schema';

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)));

/**
 *
 * @param tab An optional tab from which to create the rule, otherwise uses last active tab
 */
const useCreateRuleFromTab = (tab?: chrome.tabs.Tab | null) => {
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(tab ?? null);
  const [isResolved, setIsResolved] = useState(tab !== undefined);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (tab !== undefined) {
      setActiveTab(tab);
      setError(null);
      setIsResolved(true);
      return;
    }

    chrome.tabs
      .query({ active: true, lastFocusedWindow: true })
      .then((tabs) => {
        setActiveTab(tabs[0] ?? null);
        setError(null);
        setIsResolved(true);
      })
      .catch((queryError) => {
        console.error(queryError);
        setError(toError(queryError));
        setIsResolved(true);
      });
  }, [tab]);

  const createUrlRule = useCallback(
    (matchType: MatchType, patternType: 'domain' | 'path'): BlockRule | null => {
      return RulesService.createUrlRule(activeTab?.url, matchType, patternType);
    },
    [activeTab],
  );

  return {
    activeTab,
    error,
    isResolved,
    createExactUrlRule: () => createUrlRule('exact', 'path'),
    createPrefixUrlRule: () => createUrlRule('prefix', 'path'),
    createDomainPrefixRule: () => createUrlRule('prefix', 'domain'),
  };
};

export default useCreateRuleFromTab;
