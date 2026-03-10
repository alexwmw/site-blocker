import type { BlockRule, Settings } from '../../../types/schema';
import { RulesService } from '../../RulesService';
import { StorageService } from '../../StorageService';
import { getBlockPageUrl } from '../getBlockPageUrl';

import type { BlockingStrategy, UnblockResult } from './BlockingStrategy';

type EnforceArgs = {
  tabId?: number;
  url?: string;
  rule?: BlockRule;
  reason?: string;
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
      return { reason: 'Not started' };
    }
    if (!url || !tabId) {
      return { reason: 'No url and/or tabId' };
    }
    console.log({ url, rules: this.rules });
    const matchingActiveRule: BlockRule | null = await RulesService.findMatchingRule(url, this.rules);
    if (!matchingActiveRule) {
      return { reason: 'No matching rule' };
    }
    if (matchingActiveRule.unblockUntil) {
      if (matchingActiveRule.unblockUntil > Date.now()) {
        return { reason: 'Unblock until is in effect' };
      }
    }
    return { tabId, url, rule: matchingActiveRule };
  }

  private async enforce({ tabId, url, rule, reason }: EnforceArgs): Promise<void> {
    // If a rule matches, build a block-page URL with context (ruleId, targetUrl, match info) and redirect tab there.
    if (!tabId || !url || !rule) {
      return;
    }
    const destination = TabRedirectStrategy.buildBlockPageUrl(rule, url);

    await chrome.tabs.update(tabId, { url: destination });
    return;
  }

  private getUnblockUntilTime() {
    const { enabled, durationMinutes = 0 } = this.settings?.revisit ?? {};
    if (!enabled || !durationMinutes) {
      return null;
    }
    return Date.now() + durationMinutes * 60 * 1000;
  }

  private static splitPattern(pattern: string): { host: string; path: string } {
    const [host = '', ...pathParts] = RulesService.normaliseRulePattern(pattern).split('/');
    const path = pathParts.length > 0 ? `/${pathParts.join('/')}` : '';
    return { host, path };
  }

  private static buildBlockPageUrl(rule: BlockRule, targetUrl: string): string {
    const { host, path } = TabRedirectStrategy.splitPattern(rule.pattern);
    const blockPageUrl = getBlockPageUrl();
    const params = new URLSearchParams({
      ruleId: rule.id,
      targetUrl,
      patternHost: host,
      patternPath: path,
      matchType: rule.matchType,
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

  /**
   * Stop watching browser activity.
   * Remove listeners.
   * No more redirect decisions happen.
   */
  async stop() {
    if (!this.started) {
      return;
    }
    chrome.tabs.onUpdated.removeListener(this.handleTabUpdate);
    chrome.tabs.onActivated.removeListener(this.handleTabActivated);
    this.started = false;
  }

  /**
   * Replace in-memory rules/settings with latest data.
   * From now on, listener callbacks use these newest rules.
   * May also clear stale temporary state if needed.
   *
   * @param rules
   * @param settings
   */
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
   * @param ruleId
   * @param targetUrl
   * @param senderTabId
   */
  async handleUnblock(ruleId: string, targetUrl: string, senderTabId?: number): Promise<UnblockResult> {
    if (!RulesService.isSupportedUrl(targetUrl)) {
      return { ok: false, reason: 'Unsupported target URL.' };
    }
    const unblockUntil = this.getUnblockUntilTime();
    if (unblockUntil) {
      await StorageService.updateRule(ruleId, { unblockUntil });
    }
    if (typeof senderTabId === 'number') {
      await chrome.tabs.update(senderTabId, { url: targetUrl });
    }
    return {
      ok: true,
    };
  }
}
