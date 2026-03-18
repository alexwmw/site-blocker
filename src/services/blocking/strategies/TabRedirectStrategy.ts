import { getBlockPageUrl } from '../getBlockPageUrl';

import type { BlockingStrategy, SyncItems } from './BlockingStrategy';

import { RulesService } from '@/services/RulesService';
import { SchedulingService } from '@/services/SchedulingService';
import { StorageService } from '@/services/StorageService';
import type { UnblockResponse } from '@/types/messages';
import type { BlockRule, Settings } from '@/types/schema';

type EnforceArgs = {
  tabId?: number;
  url?: string;
  rules?: BlockRule[];
};

const TAB_EXEMPTION_TIMEOUT = 10000;

export default class TabRedirectStrategy implements BlockingStrategy {
  private rules: BlockRule[] = [];

  private settings: Settings | null = null;

  private started = false;

  private temporarilyExemptTabs: Set<number> = new Set<number>();

  private exemptTabWhileLoading(tabId: number) {
    this.temporarilyExemptTabs.add(tabId);

    // fallback -- remove exemption after a set amount of time
    setTimeout(() => {
      this.temporarilyExemptTabs.delete(tabId);
    }, TAB_EXEMPTION_TIMEOUT);
  }

  private readonly handleTabCompletion = (tabId: number, changeInfo: chrome.tabs.OnUpdatedInfo) => {
    if (changeInfo.status === 'complete') {
      this.temporarilyExemptTabs.delete(tabId);
    }
  };

  private readonly handleTabRemoved = (tabId: number): void => {
    this.temporarilyExemptTabs.delete(tabId);
  };

  private readonly handleTabUpdate = (tabId: number, _changeInfo: chrome.tabs.OnUpdatedInfo) => {
    const evaluateAndEnforce = async (tab: chrome.tabs.Tab) => {
      const args = await this.evaluate(tabId, tab.url);
      await this.enforce(args);
    };
    chrome.tabs.get(tabId).then(evaluateAndEnforce).catch(console.error);
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
    if (this.temporarilyExemptTabs.has(tabId)) {
      return {};
    }
    const matchingRules: BlockRule[] = RulesService.findMatchingRules(url, this.rules);
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
    this.temporarilyExemptTabs.clear();
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate);
    chrome.tabs.onUpdated.addListener(this.handleTabCompletion);
    chrome.tabs.onRemoved.addListener(this.handleTabRemoved);
    chrome.tabs.onActivated.addListener(this.handleTabActivated);
  }

  async stop() {
    if (!this.started) {
      return;
    }
    chrome.tabs.onUpdated.removeListener(this.handleTabUpdate);
    chrome.tabs.onActivated.removeListener(this.handleTabActivated);
    chrome.tabs.onUpdated.removeListener(this.handleTabCompletion);
    chrome.tabs.onRemoved.removeListener(this.handleTabRemoved);

    this.started = false;
  }

  private async reevaluateOpenTabs() {
    if (!this.started) {
      return;
    }

    const tabs = await chrome.tabs.query({});
    await Promise.all(
      tabs.map(async (tab) => {
        const args = await this.evaluate(tab.id, tab.url);
        await this.enforce(args);
      }),
    );
  }

  async sync({ rules, settings }: SyncItems) {
    if (settings) {
      this.settings = settings;
    }
    if (rules) {
      this.rules = rules;
    }

    if (settings || rules) {
      await this.reevaluateOpenTabs();
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
  async handleUnblock(ruleIds: string[], targetUrl: string, senderTabId?: number): Promise<UnblockResponse> {
    if (!RulesService.isSupportedUrl(targetUrl)) {
      return { ok: false, reason: 'Unsupported target URL.' };
    }
    const unblockUntil = this.getUnblockUntilTime();
    let hasMissingRule;
    if (unblockUntil) {
      const promises = ruleIds.map((ruleId) => StorageService.updateRule(ruleId, { unblockUntil }));
      const results = await Promise.all(promises);
      hasMissingRule = results.some((result) => result === null);
    }
    if (hasMissingRule) {
      console.warn('Some rules expected in handleUnblock were not found.');
    }
    if (typeof senderTabId === 'number') {
      this.exemptTabWhileLoading(senderTabId);
      return {
        ok: true,
        // We may at some stage wish to return a redirect function, for example:
        // redirectTab: () => chrome.tabs.update(senderTabId, { url: targetUrl }),
      };
    }
    return {
      ok: true,
    };
  }
}
