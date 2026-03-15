import type { UnblockResponse } from '../../../types/messages';
import type { StorageSchema } from '../../../types/schema';

export type SyncItems = Partial<StorageSchema>;

export interface BlockingStrategy {
  start(): Promise<void>;
  stop(): Promise<void>;
  sync(items: SyncItems): Promise<void>;
  handleUnblock(ruleIds: string[], targetUrl: string, senderTabId?: number): Promise<UnblockResponse>;
}
