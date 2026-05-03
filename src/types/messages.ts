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

export type RuntimeRequest = UnblockRequestMessage | TestUrlRequestMessage;

export type UnblockResponse = {
  ok: boolean;
  reason?: string;
};
export type TestUrlResponse = {
  ok: boolean;
  reason?: string;
  status: 'blocked' | 'unblocked';
};

// map request "type" to response shape
export type RuntimeResponseByType = {
  UNBLOCK_REQUEST: UnblockResponse;
  TEST_URL_REQUEST: TestUrlResponse;
};

export type RuntimeResponse = UnblockResponse | TestUrlResponse;

export type ResponseForRequest<TReq extends RuntimeRequest> = RuntimeResponseByType[TReq['type']];
