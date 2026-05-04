import type BlockingEngine from './blocking/BlockingEngine';

import { RulesService } from '@/services/RulesService';
import { SchedulingService } from '@/services/SchedulingService';
import defaultSettings from '@/services/defaultSettings';
import { SiteIdentityService } from '@/services/SiteIdentityService';
import { StorageService } from '@/services/StorageService';
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
        case 'TEST_URL_REQUEST': {
          (async () => {
            const urlIsBlocked = await blockingEngine.testUrlIsBlocked(message.payload.targetUrl);
            sendResponse({ ok: true, status: urlIsBlocked ? 'blocked' : 'unblocked' });
          })().catch((err) => sendResponse({ ok: false, reason: String(err), status: 'unblocked' }));
          return true;
        }
        case 'GET_BLOCK_RULES_REQUEST': {
          (async () => {
            const blockRules = await StorageService.getRules();
            sendResponse({ ok: true, blockRules });
          })().catch((err) => sendResponse({ ok: false, reason: String(err), blockRules: [] }));
          return true;
        }
        case 'ADD_BLOCK_RULE_REQUEST': {
          (async () => {
            await StorageService.addRule(message.payload.rule);
            sendResponse({ ok: true });
          })().catch((err) => sendResponse({ ok: false, reason: String(err) }));
          return true;
        }
        case 'REMOVE_BLOCK_RULE_REQUEST': {
          (async () => {
            await StorageService.removeRule(message.payload.id);
            sendResponse({ ok: true });
          })().catch((err) => sendResponse({ ok: false, reason: String(err) }));
          return true;
        }
        case 'UPDATE_BLOCK_RULE_REQUEST': {
          (async () => {
            await StorageService.updateRule(message.payload.id, message.payload.updates);
            sendResponse({ ok: true });
          })().catch((err) => sendResponse({ ok: false, reason: String(err) }));
          return true;
        }
        case 'GET_SETTINGS_REQUEST': {
          (async () => {
            const settings = await StorageService.getSettings();
            sendResponse({ ok: true, settings });
          })().catch((err) => sendResponse({ ok: false, reason: String(err), settings: defaultSettings }));
          return true;
        }
        case 'UPDATE_SETTINGS_REQUEST': {
          (async () => {
            await StorageService.updateSettings(message.payload.updates);
            sendResponse({ ok: true });
          })().catch((err) => sendResponse({ ok: false, reason: String(err) }));
          return true;
        }
        case 'CREATE_RULE_FROM_URL_REQUEST': {
          (async () => {
            const rule = RulesService.createUrlRule(message.payload.url ?? undefined, message.payload.matchType, message.payload.patternType);
            sendResponse({ ok: true, rule });
          })().catch((err) => sendResponse({ ok: false, reason: String(err), rule: null }));
          return true;
        }
        case 'GET_POPUP_STATE_REQUEST': {
          (async () => {
            const rules = await StorageService.getRules();
            const settings = await StorageService.getSettings();
            const matchingRules = message.payload.url ? RulesService.findMatchingRules(message.payload.url, rules) : [];
            const matchingTemporarilyUnblockedRules = matchingRules.filter((rule) => (rule.unblockUntil ?? 0) > Date.now());
            sendResponse({
              ok: true,
              matchingRuleIds: matchingRules.map((rule) => rule.id),
              matchingTemporarilyUnblockedRuleIds: matchingTemporarilyUnblockedRules.map((rule) => rule.id),
              isScheduleEnabled: Boolean(settings.schedule.enabled),
              isBlockingTime: SchedulingService.isBlockingActiveNow(settings.schedule),
              siteIdentity: SiteIdentityService.fromUrl(message.payload.url, {
                preferredFaviconUrl: message.payload.favIconUrl ?? null,
              }),
            });
          })().catch((err) =>
            sendResponse({
              ok: false,
              reason: String(err),
              matchingRuleIds: [],
              matchingTemporarilyUnblockedRuleIds: [],
              isScheduleEnabled: false,
              isBlockingTime: true,
              siteIdentity: SiteIdentityService.fromUrl(null),
            }),
          );
          return true;
        }
        default:
          return false;
      }
    };
    chrome.runtime.onMessage.addListener(listener);

    return () => {
      if (!this.started) {
        return;
      }
      chrome.runtime.onMessage.removeListener(listener);
      this.started = false;
    };
  }
}
