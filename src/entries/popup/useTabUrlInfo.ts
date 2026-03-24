import { RulesService } from '@/services/RulesService';
import { isExtensionUrl } from '@/utils/extensionUrls';

const useTabUrlInfo = (activeTab: chrome.tabs.Tab | null) => {
  if (!activeTab?.url) {
    return {};
  }
  const url = activeTab.url;
  const isSupported = Boolean(url && RulesService.isSupportedUrl(url));
  const isExtensionPageUrl = isExtensionUrl(url);
  const domain = RulesService.domainPatternFromUrl(url);
  const path = RulesService.pathPatternFromUrl(url);
  return { url, isSupported, isExtensionPageUrl, domain, path };
};
export default useTabUrlInfo;