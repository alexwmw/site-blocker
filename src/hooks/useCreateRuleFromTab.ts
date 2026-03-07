import { useEffect, useState } from 'react';

import { BlockService } from '../services/BlockService';
import type { BlockRule, MatchType } from '../types/schema';
import { createRuleId } from '../utils/createRuleId';

/**
 * Builds block rules from a tab URL.
 *
 * @param tab Optional tab to use directly. If omitted, the hook queries the currently active tab.
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
        setActiveTab(tabs[0] ?? null);
      })
      .catch(console.error);
  }, [tab]);

  useEffect(() => {
    const url = activeTab?.url;
    setIsSupported(Boolean(url && BlockService.isSupportedUrl(url)));
  }, [activeTab]);

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
