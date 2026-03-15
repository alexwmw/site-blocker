export type UnblockRequestMessage = {
  type: 'UNBLOCK_REQUEST';
  payload: {
    ruleIds: string[];
    targetUrl: string;
  };
};

export type RuntimeRequest = UnblockRequestMessage;

export type UnblockResponse = {
  ok: boolean;
  reason?: string;
};

// map request "type" to response shape
export type RuntimeResponseByType = {
  UNBLOCK_REQUEST: UnblockResponse;
};

export type RuntimeResponse = UnblockResponse;

export type ResponseForRequest<TReq extends RuntimeRequest> = RuntimeResponseByType[TReq['type']];
