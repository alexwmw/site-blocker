import { useCallback, useEffect, useMemo, useState } from 'react';

import { RulesService } from '@/services/RulesService';
import type { BlockRule, MatchType } from '@/types/schema';
import { createUniqueId } from '@/utils/createUniqueId';

/**
 *
 * @param tab An optional tab from which to create the rule, otherwise uses last active tab
 */
const useCreateRuleFromTab = (tab?: chrome.tabs.Tab | null) => {
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(tab ?? null);

  const isSupported = useMemo(() => {
    const url = activeTab?.url;
    return Boolean(url && RulesService.isSupportedUrl(url));
  }, [activeTab]);

  useEffect(() => {
    if (tab !== undefined) {
      setActiveTab(tab);
      return;
    }
    chrome.tabs
      .query({ active: true, lastFocusedWindow: true })
      .then((tabs) => setActiveTab(tabs[0] ?? null))
      .catch(console.error);
  }, [tab]);

  const createUrlRule = useCallback(
    (matchType: MatchType, patternType: 'domain' | 'path'): BlockRule | null => {
      const url = activeTab?.url;
      if (!url || !isSupported) {
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
    [activeTab, isSupported],
  );

  return {
    activeTab,
    url: activeTab?.url ?? null,
    isSupported,
    createExactUrlRule: () => createUrlRule('exact', 'path'),
    createPrefixUrlRule: () => createUrlRule('prefix', 'path'),
    createDomainPrefixRule: () => createUrlRule('prefix', 'domain'),
  };
};
export default useCreateRuleFromTab;
