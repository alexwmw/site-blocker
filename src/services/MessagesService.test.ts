import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createEvent } from '@/services/blocking/test-utils';

describe('MessagesService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  async function loadSubject() {
    const onMessage =
      createEvent<[message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (res?: unknown) => void]>();
    const sendMessageMock = vi.fn<(message: unknown) => Promise<unknown>>();

    vi.stubGlobal('chrome', {
      runtime: {
        sendMessage: sendMessageMock,
        onMessage,
      },
    });

    const mod = await import('./MessagesService');
    return { MessagesService: mod.MessagesService, onMessage, sendMessageMock };
  }

  it('forwards sendMessage through chrome.runtime.sendMessage', async () => {
    const { MessagesService, sendMessageMock } = await loadSubject();
    sendMessageMock.mockResolvedValue({ ok: true });

    const result = await MessagesService.sendMessage({
      type: 'UNBLOCK_REQUEST',
      payload: { ruleIds: ['rule-1'], targetUrl: 'https://example.com' },
    });

    expect(sendMessageMock).toHaveBeenCalledWith({
      type: 'UNBLOCK_REQUEST',
      payload: { ruleIds: ['rule-1'], targetUrl: 'https://example.com' },
    });
    expect(result).toEqual({ ok: true });
  });

  it('registers an async listener that delegates unblock requests', async () => {
    const { MessagesService, onMessage } = await loadSubject();
    const blockingEngine = {
      handleUnblock: vi.fn(async () => ({ ok: true })),
      testUrlIsBlocked: vi.fn(),
    };

    const cleanup = MessagesService.startListening(blockingEngine as never);
    const sendResponse = vi.fn();

    onMessage.emit(
      {
        type: 'UNBLOCK_REQUEST',
        payload: { ruleIds: ['rule-1'], targetUrl: 'https://example.com' },
      },
      { tab: { id: 42 } } as chrome.runtime.MessageSender,
      sendResponse,
    );
    await Promise.resolve();

    expect(blockingEngine.handleUnblock).toHaveBeenCalledWith(['rule-1'], 'https://example.com', 42);
    expect(sendResponse).toHaveBeenCalledWith({ ok: true });

    cleanup();
  });

  it('returns blocked/unblocked test results and cleans up listeners', async () => {
    const { MessagesService, onMessage } = await loadSubject();
    const blockingEngine = {
      handleUnblock: vi.fn(),
      testUrlIsBlocked: vi.fn(async () => false),
    };

    const cleanup = MessagesService.startListening(blockingEngine as never);
    const sendResponse = vi.fn();

    onMessage.emit(
      {
        type: 'TEST_URL_REQUEST',
        payload: { targetUrl: 'https://example.com' },
      },
      {} as chrome.runtime.MessageSender,
      sendResponse,
    );
    await Promise.resolve();

    expect(blockingEngine.testUrlIsBlocked).toHaveBeenCalledWith('https://example.com');
    expect(sendResponse).toHaveBeenCalledWith({ ok: true, status: 'unblocked' });

    cleanup();

    expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalledTimes(1);
  });

  it('guards against double-starting listeners', async () => {
    const { MessagesService } = await loadSubject();

    const cleanup = MessagesService.startListening({} as never);
    const noopCleanup = MessagesService.startListening({} as never);

    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);

    cleanup();
    noopCleanup();
  });

  it('surfaces async listener failures through sendResponse', async () => {
    const { MessagesService, onMessage } = await loadSubject();
    const blockingEngine = {
      handleUnblock: vi.fn(async () => {
        throw new Error('boom');
      }),
      testUrlIsBlocked: vi.fn(),
    };

    const cleanup = MessagesService.startListening(blockingEngine as never);
    const sendResponse = vi.fn();

    onMessage.emit(
      {
        type: 'UNBLOCK_REQUEST',
        payload: { ruleIds: ['rule-1'], targetUrl: 'https://example.com' },
      },
      {} as chrome.runtime.MessageSender,
      sendResponse,
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(sendResponse).toHaveBeenCalledWith({ ok: false, reason: 'Error: boom' });

    cleanup();
  });
});
