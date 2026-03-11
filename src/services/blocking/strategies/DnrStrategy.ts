import type { BlockRule, Settings } from '../../../types/schema';

import type { BlockingStrategy, UnblockResult } from './BlockingStrategy';

export default class DnrStrategy implements BlockingStrategy {
  /**
   * Enable DNR enforcement mode
   * Could set internal flags and ensure strategy is ready.
   * Most enforcement happens through rules installed during sync.
   */
  async start() {}

  /**
   * Disable DNR enforcement mode.
   * Remove/disable dynamic DNR rules this strategy added (or mark inactive).
   * Ensures Chrome stops auto-blocking via this strategy.
   */
  async stop() {}

  /**
   * Rebuild Chrome’s DNR rule set from latest source of truth.
   * Convert app rules/settings into DNR-compatible rules.
   * Push add/remove/update operations to chrome.declarativeNetRequest.
   * Result: Chrome now enforces exactly current config.
   *
   * @param rules
   * @param settings
   */
  async sync(rules: BlockRule[], settings: Settings) {}

  /**
   * Since DNR blocks via Chrome rule tables, unblock means:
   *
   * Temporarily change DNR state so this rule/url is allowed (e.g., disable matching DNR rule or add a higher-priority allow rule).
   *
   * If you can’t support this yet, return explicit unsupported reason.
   *
   * @param ruleIds
   * @param targetUrl
   * @param senderTabId
   */
  async handleUnblock(ruleIds: string[], targetUrl: string, senderTabId?: number): Promise<UnblockResult> {
    return {
      ok: false,
      reason: '?',
    };
  }
}
