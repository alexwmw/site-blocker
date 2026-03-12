import type { BlockRule, Settings } from '../../../types/schema';
import { RulesService } from '../../RulesService';
import { StorageService } from '../../StorageService';
import { getBlockPageUrl } from '../getBlockPageUrl';

import type { BlockingStrategy, UnblockResult } from './BlockingStrategy';

type EnforceArgs = {
  tabId?: number;
  url?: string;
  rules?: BlockRule[];
};

export default class TabRedirectStrategy implements BlockingStrategy {
  private rules: BlockRule[] = [];

  private settings: Settings | null = null;

  private started = false;

  private readonly handleTabUpdate = (tabId: number, changeInfo: chrome.tabs.OnUpdatedInfo) => {
    if (changeInfo.url) {
      this.evaluate(tabId, changeInfo.url).then(this.enforce).catch(console.error);
    }
  };

  private readonly handleTabActivated = ({ tabId }: chrome.tabs.OnActivatedInfo) => {
    chrome.tabs
      .get(tabId)
      .then((tab) => this.evaluate(tab.id, tab.url))
      .then(this.enforce)
      .catch(console.error);
  };

  private async evaluate(tabId?: number, url?: string) {
    if (!this.started) {
      return {};
    }
    if (typeof tabId !== 'number' || !url) {
      return {};
    }
    const matchingRules: BlockRule[] = await RulesService.findMatchingRules(url, this.rules);
    if (matchingRules.length === 0) {
      return {};
    }
    const matchingActiveRules = matchingRules.filter((rule: BlockRule) => !((rule.unblockUntil ?? NaN) > Date.now()));
    if (matchingActiveRules.length === 0) {
      return {};
    }
    return { tabId, url, rules: matchingActiveRules };
  }

  private async enforce({ tabId, url, rules }: EnforceArgs): Promise<void> {
    if (typeof tabId !== 'number' || !url || !rules) {
      return;
    }
    const destination = TabRedirectStrategy.buildBlockPageUrl(rules, url);

    await chrome.tabs.update(tabId, { url: destination });
    return;
  }

  private getUnblockUntilTime() {
    const { enabled, durationMinutes = 0 } = this.settings?.extendedUnblock ?? {};
    if (!enabled || !durationMinutes) {
      return null;
    }
    return Date.now() + durationMinutes * 60 * 1000;
  }

  private static buildBlockPageUrl(_rules: BlockRule[], targetUrl: string): string {
    const prioritisedRules = RulesService.sortRulesBySpecificity(_rules);
    const rule = prioritisedRules[0];
    const { host, path } = RulesService.splitPattern(rule.pattern);
    const blockPageUrl = getBlockPageUrl();
    const params = new URLSearchParams({
      targetUrl,
      patternHost: host,
      patternPath: path,
      matchType: rule.matchType,
      ruleIds: prioritisedRules.map((r) => r.id).join(','),
    });
    return `${blockPageUrl}?${params.toString()}`;
  }

  async start() {
    if (this.started) {
      return;
    }
    this.started = true;
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate);
    chrome.tabs.onActivated.addListener(this.handleTabActivated);
  }

  async stop() {
    if (!this.started) {
      return;
    }
    chrome.tabs.onUpdated.removeListener(this.handleTabUpdate);
    chrome.tabs.onActivated.removeListener(this.handleTabActivated);
    this.started = false;
  }

  async sync(rules: BlockRule[], settings: Settings) {
    this.rules = rules;
    this.settings = settings;
  }

  /**
   * Since this strategy blocks by redirecting tabs, unblock means:
   * - Don’t block that rule for a short period (engine/rules state handles this via unblockUntil).
   * - Navigate the requesting tab back to targetUrl immediately (if senderTabId available).
   * return success/failure.
   *
   * @param ruleIds
   * @param targetUrl
   * @param senderTabId
   */
  async handleUnblock(ruleIds: string[], targetUrl: string, senderTabId?: number): Promise<UnblockResult> {
    if (!RulesService.isSupportedUrl(targetUrl)) {
      return { ok: false, reason: 'Unsupported target URL.' };
    }
    let hasMissingRule = false;
    const unblockUntil = this.getUnblockUntilTime();
    if (unblockUntil) {
      const results = await Promise.all(ruleIds.map((ruleId) => StorageService.updateRule(ruleId, { unblockUntil })));
      hasMissingRule = results.some((result) => result === null);
    }
    // Always navigate the sender tab when target URL is supported so users are not stuck on block page,
    // even if some rule IDs were stale/missing.
    if (typeof senderTabId === 'number') {
      await chrome.tabs.update(senderTabId, { url: targetUrl });
    }
    if (hasMissingRule) {
      return { ok: false, reason: 'One or more rules were not found.' };
    }
    return { ok: true };
  }
}
