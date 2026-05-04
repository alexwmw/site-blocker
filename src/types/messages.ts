import type { SiteIdentityModel } from '@/services/SiteIdentityService';
import type { BlockRule, Settings } from '@/types/schema';

export type UnblockRequestMessage = {
  type: 'UNBLOCK_REQUEST';
  payload: {
    ruleIds: string[];
    targetUrl: string;
  };
};
export type TestUrlRequestMessage = {
  type: 'TEST_URL_REQUEST';
  payload: {
    targetUrl: string;
  };
};

export type GetBlockRulesRequestMessage = { type: 'GET_BLOCK_RULES_REQUEST' };
export type AddBlockRuleRequestMessage = { type: 'ADD_BLOCK_RULE_REQUEST'; payload: { rule: BlockRule } };
export type RemoveBlockRuleRequestMessage = { type: 'REMOVE_BLOCK_RULE_REQUEST'; payload: { id: string } };
export type UpdateBlockRuleRequestMessage = {
  type: 'UPDATE_BLOCK_RULE_REQUEST';
  payload: { id: string; updates: Partial<BlockRule> };
};

export type GetSettingsRequestMessage = { type: 'GET_SETTINGS_REQUEST' };
export type UpdateSettingsRequestMessage = { type: 'UPDATE_SETTINGS_REQUEST'; payload: { updates: Partial<Settings> } };

export type CreateRuleFromUrlRequestMessage = {
  type: 'CREATE_RULE_FROM_URL_REQUEST';
  payload: { url: string | null | undefined; matchType: 'exact' | 'prefix'; patternType: 'domain' | 'path' };
};

export type GetPopupStateRequestMessage = {
  type: 'GET_POPUP_STATE_REQUEST';
  payload: { url: string | null | undefined; favIconUrl?: string | null };
};

export type RuntimeRequest =
  | UnblockRequestMessage
  | TestUrlRequestMessage
  | GetBlockRulesRequestMessage
  | AddBlockRuleRequestMessage
  | RemoveBlockRuleRequestMessage
  | UpdateBlockRuleRequestMessage
  | GetSettingsRequestMessage
  | UpdateSettingsRequestMessage
  | CreateRuleFromUrlRequestMessage
  | GetPopupStateRequestMessage;

export type UnblockResponse = {
  ok: boolean;
  reason?: string;
};
export type TestUrlResponse = {
  ok: boolean;
  reason?: string;
  status: 'blocked' | 'unblocked';
};

export type MutationResponse = { ok: boolean; reason?: string };
export type GetBlockRulesResponse = { ok: boolean; reason?: string; blockRules: BlockRule[] };
export type GetSettingsResponse = { ok: boolean; reason?: string; settings: Settings };
export type CreateRuleFromUrlResponse = { ok: boolean; reason?: string; rule: BlockRule | null };
export type GetPopupStateResponse = {
  ok: boolean;
  reason?: string;
  matchingRuleIds: string[];
  matchingTemporarilyUnblockedRuleIds: string[];
  isBlockingTime: boolean;
  isScheduleEnabled: boolean;
  siteIdentity: SiteIdentityModel;
};

export type RuntimeResponseByType = {
  UNBLOCK_REQUEST: UnblockResponse;
  TEST_URL_REQUEST: TestUrlResponse;
  GET_BLOCK_RULES_REQUEST: GetBlockRulesResponse;
  ADD_BLOCK_RULE_REQUEST: MutationResponse;
  REMOVE_BLOCK_RULE_REQUEST: MutationResponse;
  UPDATE_BLOCK_RULE_REQUEST: MutationResponse;
  GET_SETTINGS_REQUEST: GetSettingsResponse;
  UPDATE_SETTINGS_REQUEST: MutationResponse;
  CREATE_RULE_FROM_URL_REQUEST: CreateRuleFromUrlResponse;
  GET_POPUP_STATE_REQUEST: GetPopupStateResponse;
};

export type RuntimeResponse = RuntimeResponseByType[keyof RuntimeResponseByType];

export type ResponseForRequest<TReq extends RuntimeRequest> = RuntimeResponseByType[TReq['type']];
