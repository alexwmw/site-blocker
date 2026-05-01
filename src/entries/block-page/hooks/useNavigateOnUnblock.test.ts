import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MessagesService } from '@/services/MessagesService';

import useNavigateOnUnblock from './useNavigateOnUnblock';

vi.mock('@/services/MessagesService', () => ({
  MessagesService: {
    sendMessage: vi.fn(),
  },
}));

describe('useNavigateOnUnblock', () => {
  const sendMessageMock = vi.mocked(MessagesService.sendMessage);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    sendMessageMock.mockImplementation(async (message) => {
      if (message.type === 'TEST_URL_REQUEST') {
        return { ok: true, status: 'blocked' };
      }

      return { ok: true };
    });

    vi.spyOn(window.location, 'replace').mockImplementation(() => undefined);
  });

  it('unblocks and navigates immediately after delay when the button is released before delay completes', async () => {
    const { rerender } = renderHook(
      ({ isUnblocked, held }) => useNavigateOnUnblock(['rule-1'], 'https://example.com', isUnblocked, held),
      { initialProps: { isUnblocked: false, held: true } },
    );

    rerender({ isUnblocked: true, held: true });
    rerender({ isUnblocked: true, held: false });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(sendMessageMock).toHaveBeenCalledWith({
      type: 'UNBLOCK_REQUEST',
      payload: { ruleIds: ['rule-1'], targetUrl: 'https://example.com' },
    });
    expect(window.location.replace).toHaveBeenCalledWith('https://example.com');
  });

  it('waits for release after delay when the button is still held, then unblocks and navigates', async () => {
    const { rerender } = renderHook(
      ({ isUnblocked, held }) => useNavigateOnUnblock(['rule-1'], 'https://example.com', isUnblocked, held),
      { initialProps: { isUnblocked: false, held: true } },
    );

    rerender({ isUnblocked: true, held: true });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(sendMessageMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'UNBLOCK_REQUEST',
      }),
    );

    rerender({ isUnblocked: true, held: false });

    await act(async () => {
      await Promise.resolve();
    });

    expect(sendMessageMock).toHaveBeenCalledWith({
      type: 'UNBLOCK_REQUEST',
      payload: { ruleIds: ['rule-1'], targetUrl: 'https://example.com' },
    });
    expect(window.location.replace).toHaveBeenCalledWith('https://example.com');
  });
});
