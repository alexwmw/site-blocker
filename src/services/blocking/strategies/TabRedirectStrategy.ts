import type { BlockRule, Settings } from '../../../types/schema';

import type { BlockingStrategy, UnblockResult } from './BlockingStrategy';

export default class TabRedirectStrategy implements BlockingStrategy {
  async start() {}
  async stop() {}
  async sync(rules: BlockRule[], settings: Settings) {}
  async handleUnblock(ruleId: string, targetUrl: string, senderTabId?: number): Promise<UnblockResult> {
    return {
      ok: false,
    };
  }
}
