import { useEffect, useState } from 'react';

import { BlockService } from '../services/BlockService';
import type { BlockRule, MatchType } from '../types/schema';
import { createRuleId } from '../utils/createRuleId';

/**
 *
 * @param tab An optional tab from which to create the rule, otherwise uses last active tab
 */
const useCreateRuleFromTab = (tab?: chrome.tabs.Tab) => {
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(tab ?? null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    if (tab) {
      return;
    }
    const query: chrome.tabs.QueryInfo = { active: true, lastFocusedWindow: true };
    chrome.tabs
      .query(query)
      .then((tabs) => {
        const activeTab = tabs[0];
        setActiveTab(activeTab);
        setIsSupported(Boolean(activeTab?.url && BlockService.isSupportedUrl(activeTab.url)));
      })
      .catch(console.error);
  }, [tab]);

  const createUrlRule = (matchType: MatchType, patternType: 'domain' | 'path'): BlockRule | null => {
    const url = activeTab?.url;
    if (!url || !isSupported) {
      return null;
    }

    let pattern: string | null;

    switch (patternType) {
      case 'domain':
        pattern = BlockService.domainPatternFromUrl(url);
        break;
      case 'path':
        pattern = BlockService.pathPatternFromUrl(url);
    }

    if (!pattern) {
      return null;
    }

    return {
      id: createRuleId(),
      matchType,
      pattern,
      createdAt: new Date().toISOString(),
      enabled: true,
    };
  };

  return {
    activeTab,
    isSupported,
    createExactUrlRule: () => createUrlRule('exact', 'path'),
    createPrefixUrlRule: () => createUrlRule('prefix', 'path'),
    createDomainPrefixRule: () => createUrlRule('prefix', 'domain'),
  };
};
export default useCreateRuleFromTab;
