import type { UnblockResponse } from '../../../../types/messages';
import type { BlockRule, Settings } from '../../../../types/schema';
import { RulesService } from '../../../RulesService';
import { StorageService } from '../../../StorageService';
import type { BlockingStrategy, SyncItems } from '../BlockingStrategy';

const MANAGED_RULE_ID_MIN = 1_000_000;
const MANAGED_RULE_ID_SPACE = 900_000_000;

export default class DnrStrategy implements BlockingStrategy {
  private started = false;

  private rules: BlockRule[] = [];

  private settings: Settings | null = null;

  private isManagedRuleId(ruleId: number): boolean {
    return ruleId >= MANAGED_RULE_ID_MIN && ruleId < MANAGED_RULE_ID_MIN + MANAGED_RULE_ID_SPACE;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  }

  private buildExactRegexFilter(rule: BlockRule): string {
    const { host, path } = RulesService.splitPattern(rule.pattern);
    const escapedHost = this.escapeRegex(host);
    const escapedPath = this.escapeRegex(path);
    const hostPrefix = `^https?://(?:[^./]+\\.)*${escapedHost}(?::\\d+)?`;

    if (!path) {
      return `${hostPrefix}/?(?:[?#].*)?$`;
    }

    return `${hostPrefix}${escapedPath}/?(?:[?#].*)?$`;
  }

  private buildPrefixUrlFilter(rule: BlockRule): string | undefined {
    const { path } = RulesService.splitPattern(rule.pattern);
    if (!path) {
      return undefined;
    }
    /* todo: Anchor prefix URL filter to the beginning of pathname
        The generated filter |http*://*${path}^ is too permissive for prefix semantics
        because DNR * matches any characters (including /).
        For a rule path like /r/aita, this can also match URLs such as https://reddit.com/foo/r/aita,
        even though prefix matching should only allow paths that start with /r/aita;
        this leads to over-blocking on unrelated URLs.
      */
    return `|http*://*${path}^`;
  }

  private getUnblockUntilTime() {
    const { enabled, durationMinutes = 0 } = this.settings?.extendedUnblock ?? {};
    if (!enabled || !durationMinutes) {
      return null;
    }
    return Date.now() + durationMinutes * 60 * 1000;
  }

  private toDnrRule(rule: BlockRule, ruleId: number): chrome.declarativeNetRequest.Rule {
    const { host } = RulesService.splitPattern(rule.pattern);
    const commonCondition = {
      requestDomains: [host],
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    };

    const condition: chrome.declarativeNetRequest.RuleCondition =
      rule.matchType === 'exact'
        ? {
            ...commonCondition,
            regexFilter: this.buildExactRegexFilter(rule),
          }
        : {
            ...commonCondition,
            ...(this.buildPrefixUrlFilter(rule) ? { urlFilter: this.buildPrefixUrlFilter(rule) } : {}),
          };

    return {
      id: ruleId,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: { extensionPath: '/block-page.html' },
      },
      condition,
    };
  }

  private toStableRuleId(ruleId: string): number {
    let hash = 2166136261;
    for (let i = 0; i < ruleId.length; i += 1) {
      hash ^= ruleId.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return MANAGED_RULE_ID_MIN + (Math.abs(hash) % MANAGED_RULE_ID_SPACE);
  }

  private buildRuleIdMap(appRules: BlockRule[]): Map<string, number> {
    const mapping = new Map<string, number>();
    const taken = new Set<number>();

    for (const rule of [...appRules].sort((a, b) => a.id.localeCompare(b.id))) {
      let nextId = this.toStableRuleId(rule.id);
      while (taken.has(nextId)) {
        nextId += 1;
        if (nextId >= MANAGED_RULE_ID_MIN + MANAGED_RULE_ID_SPACE) {
          nextId = MANAGED_RULE_ID_MIN;
        }
      }
      taken.add(nextId);
      mapping.set(rule.id, nextId);
    }

    return mapping;
  }

  private async applyDynamicRules(): Promise<void> {
    if (!this.started) {
      return;
    }

    const activeRules = this.rules.filter((rule) => rule.enabled && !((rule.unblockUntil ?? NaN) > Date.now()));
    const idMap = this.buildRuleIdMap(activeRules);
    const desiredRules = activeRules.map((rule) => this.toDnrRule(rule, idMap.get(rule.id)!));
    const desiredRuleIds = desiredRules.map((rule) => rule.id);

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const managedRuleIds = existingRules.map((rule) => rule.id).filter((id) => this.isManagedRuleId(id));

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: Array.from(new Set([...managedRuleIds, ...desiredRuleIds])),
      addRules: desiredRules,
    });
  }

  async start() {
    if (this.started) {
      return;
    }
    this.started = true;
    await this.applyDynamicRules();
  }

  async stop() {
    if (!this.started) {
      return;
    }
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    const managedRuleIds = rules.map((rule) => rule.id).filter((id) => this.isManagedRuleId(id));
    if (managedRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: managedRuleIds });
    }
    this.started = false;
  }

  async sync({ rules, settings }: SyncItems) {
    if (settings) {
      this.settings = settings;
    }
    if (rules) {
      this.rules = rules;
    }
    await this.applyDynamicRules();
  }

  async handleUnblock(ruleIds: string[], targetUrl: string, senderTabId?: number): Promise<UnblockResponse> {
    if (!RulesService.isSupportedUrl(targetUrl)) {
      return { ok: false, reason: 'Unsupported target URL.' };
    }

    const unblockUntil = this.getUnblockUntilTime();
    if (!unblockUntil) {
      return { ok: false, reason: 'Extended unblock is disabled.' };
    }

    const updates = await Promise.all(ruleIds.map((ruleId) => StorageService.updateRule(ruleId, { unblockUntil })));
    const updatedRuleIds = new Set(
      updates
        .map((result, index) => (result ? ruleIds[index] : null))
        .filter((ruleId): ruleId is string => Boolean(ruleId)),
    );

    /* todo: Reinstall DNR rules when temporary unblock expires
        This updates in-memory rules with unblockUntil and reapplies DNR once,
        but there is no follow-up re-sync at expiry time.
        Because applyDynamicRules excludes rules while unblockUntil > Date.now(),
        the matching dynamic rules are removed and will stay removed after
        the timer elapses until some unrelated sync/restart happens,
        so a “temporary” unblock can become effectively permanent in normal use.
        */
    this.rules = this.rules.map((rule) => (updatedRuleIds.has(rule.id) ? { ...rule, unblockUntil } : rule));
    await this.applyDynamicRules();

    if (typeof senderTabId === 'number') {
      await chrome.tabs.update(senderTabId, { url: targetUrl });
    }

    if (updates.some((result) => result === null)) {
      return { ok: false, reason: 'One or more rules were not found.' };
    }

    return { ok: true };
  }
}
