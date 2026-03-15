import type { BlockRule, Settings } from '../../../types/schema';
import { RulesService } from '../../RulesService';
import { SchedulingService } from '../../SchedulingService';
import { StorageService } from '../../StorageService';
import { getBlockPageUrl } from '../getBlockPageUrl';

import type { BlockingStrategy, SyncItems, UnblockResult } from './BlockingStrategy';

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
      this.evaluate(tabId, changeInfo.url)
        .then((args) => this.enforce(args))
        .catch(console.error);
    }
  };

  private readonly handleTabActivated = ({ tabId }: chrome.tabs.OnActivatedInfo) => {
    chrome.tabs
      .get(tabId)
      .then((tab) => this.evaluate(tab.id, tab.url))
      .then((args) => this.enforce(args))
      .catch(console.error);
  };

  private isBlockingActiveNow(): boolean {
    return SchedulingService.isBlockingActiveNow(this.settings?.schedule);
  }

  private async evaluate(tabId?: number, url?: string) {
    if (!this.started || !this.isBlockingActiveNow()) {
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
    if (!this.isBlockingActiveNow() || typeof tabId !== 'number' || !url || !rules) {
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

  async sync({ rules, settings }: SyncItems) {
    if (settings) {
      this.settings = settings;
    }
    if (rules) {
      this.rules = rules;
    }
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
    const unblockUntil = this.getUnblockUntilTime();
    let hasMissingRule;
    if (unblockUntil) {
      const promises = ruleIds.map((ruleId) => StorageService.updateRule(ruleId, { unblockUntil }));
      const results = await Promise.all(promises);
      hasMissingRule = results.some((result) => result === null);
      // Keep navigation aligned with unblock state: if any rule is missing, do not navigate as if unblock succeeded.
    }
    if (typeof senderTabId === 'number') {
      await chrome.tabs.update(senderTabId, { url: targetUrl });
    }
    if (hasMissingRule) {
      return { ok: false, reason: 'One or more rules were not found.' };
    }
    return {
      ok: true,
    };
  }
}
