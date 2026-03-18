import type BlockingEngine from './blocking/BlockingEngine';

import type { ResponseForRequest, RuntimeRequest, RuntimeResponse, UnblockResponse } from '@/types/messages';

export class MessagesService {
  static async sendMessage<TReq extends RuntimeRequest>(message: TReq): Promise<ResponseForRequest<TReq>> {
    return await chrome.runtime.sendMessage(message);
  }

  private static started = false;

  static startListening(blockingEngine: BlockingEngine) {
    if (this.started) {
      return () => {};
    }
    this.started = true;
    const listener = (
      message: RuntimeRequest,
      sender: chrome.runtime.MessageSender,
      sendResponse: (res?: RuntimeResponse) => void,
    ) => {
      switch (message.type) {
        case 'UNBLOCK_REQUEST': {
          (async () => {
            const result: UnblockResponse = await blockingEngine.handleUnblock(
              message.payload.ruleIds,
              message.payload.targetUrl,
              sender.tab?.id,
            );
            sendResponse(result);
          })().catch((err) => sendResponse({ ok: false, reason: String(err) }));
          return true;
        }
        default:
          return false;
      }
    };
    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
      this.started = false;
    };
  }
}
