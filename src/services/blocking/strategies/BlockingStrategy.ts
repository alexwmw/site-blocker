import type { BlockRule, Settings } from '../../../types/schema';

export type UnblockResult = {
  ok: boolean;
  reason?: string;
};

export interface BlockingStrategy {
  start(): Promise<void>;
  stop(): Promise<void>;
  sync(rules: BlockRule[], settings: Settings): Promise<void>;
  handleUnblock(ruleId: string, targetUrl: string, senderTabId?: number): Promise<UnblockResult>;
}
