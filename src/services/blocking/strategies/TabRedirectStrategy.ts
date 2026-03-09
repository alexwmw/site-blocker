import type { BlockRule, Settings } from '../../../types/schema';

import type { BlockingStrategy, UnblockResult } from './BlockingStrategy';

export default class TabRedirectStrategy implements BlockingStrategy {
  /**
   * Begin watching browser activity.
   * Attach listeners like:
   * - tab URL changed
   * - user switched tabs
   * After this, strategy is “live” and can block/redirect.
   */
  async start() {}

  /**
   * Stop watching browser activity.
   * Remove listeners.
   * No more redirect decisions happen.
   */
  async stop() {}

  /**
   * Replace in-memory rules/settings with latest data.
   * From now on, listener callbacks use these newest rules.
   * May also clear stale temporary state if needed.
   *
   * @param rules
   * @param settings
   */
  async sync(rules: BlockRule[], settings: Settings) {}

  /**
   * Since this strategy blocks by redirecting tabs, unblock means:
   *
   * Don’t block that rule for a short period (engine/rules state handles this via unblockUntil).
   *
   * Navigate the requesting tab back to targetUrl immediately (if senderTabId available).
   *
   * return success/failure.
   *
   * @param ruleId
   * @param targetUrl
   * @param senderTabId
   */
  async handleUnblock(ruleId: string, targetUrl: string, senderTabId?: number): Promise<UnblockResult> {
    return {
      ok: false,
    };
  }
}
