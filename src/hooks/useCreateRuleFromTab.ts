import { useCallback, useEffect, useState } from 'react';

import { RulesService } from '@/services/RulesService';
import type { BlockRule, MatchType } from '@/types/schema';
import { createUniqueId } from '@/utils/createUniqueId';

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)));

/**
 *
 * @param tab An optional tab from which to create the rule, otherwise uses last active tab
 */
const useCreateRuleFromTab = (tab?: chrome.tabs.Tab | null) => {
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(tab ?? null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (tab !== undefined) {
      setActiveTab(tab);
      setError(null);
      return;
    }

    chrome.tabs
      .query({ active: true, lastFocusedWindow: true })
      .then((tabs) => {
        setActiveTab(tabs[0] ?? null);
        setError(null);
      })
      .catch((queryError) => {
        console.error(queryError);
        setError(toError(queryError));
      });
  }, [tab]);

  const createUrlRule = useCallback(
    (matchType: MatchType, patternType: 'domain' | 'path'): BlockRule | null => {
      const url = activeTab?.url;
      if (!url || !RulesService.isSupportedUrl(url)) {
        return null;
      }

      const pattern =
        patternType === 'domain' ? RulesService.domainPatternFromUrl(url) : RulesService.pathPatternFromUrl(url);

      if (!pattern) {
        return null;
      }

      return {
        id: createUniqueId(),
        matchType,
        pattern,
        createdAt: new Date().toISOString(),
        enabled: true,
      };
    },
    [activeTab],
  );

  return {
    activeTab,
    error,
    createExactUrlRule: () => createUrlRule('exact', 'path'),
    createPrefixUrlRule: () => createUrlRule('prefix', 'path'),
    createDomainPrefixRule: () => createUrlRule('prefix', 'domain'),
  };
};

export default useCreateRuleFromTab;
