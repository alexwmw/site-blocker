import { useEffect, useState } from 'react';

import useBlockRules from '../../hooks/useBlockRules';
import { BlockService } from '../../services/BlockService';
import type { BlockRule } from '../../types/schema';

// temporary hook just to get basic functionality
const useActiveTab = () => {
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>();
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    const queryOptions: chrome.tabs.QueryInfo = { active: true, lastFocusedWindow: true };
    chrome.tabs
      .query(queryOptions)
      .then((tabs) => {
        if (tabs && tabs.length > 0) {
          setActiveTab(tabs[0]);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    activeTab && activeTab.url && setIsSupported(BlockService.isSupportedUrl(activeTab.url));
  }, [activeTab]);

  return { activeTab, isSupported };
};

const PopupApp = () => {
  const { activeTab, isSupported } = useActiveTab();
  const { addRule } = useBlockRules();

  // Basic implementation for testing - allows easy adding of rule
  const handleAddRuleClick = () => {
    if (!activeTab || !isSupported) {
      return;
    }
    const pattern = activeTab?.url?.split('//').pop();
    if (!pattern) {
      return;
    }
    const rule: BlockRule = {
      id: 'test',
      matchType: 'domain',
      pattern,
      createdAt: new Date().toISOString(),
      enabled: true,
    };
    addRule(rule).catch(console.error);
  };

  return (
    <div>
      <button
        disabled={!activeTab || !isSupported}
        onClick={handleAddRuleClick}
      >
        Add Site
      </button>
    </div>
  );
};

export default PopupApp;
