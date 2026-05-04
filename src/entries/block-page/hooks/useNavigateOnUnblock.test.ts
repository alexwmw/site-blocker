import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useNavigateOnUnblock from './useNavigateOnUnblock';

import { MessagesService } from '@/services/MessagesService';

vi.mock('@/services/MessagesService', () => ({
  MessagesService: {
    sendMessage: vi.fn(),
  },
}));

describe('useNavigateOnUnblock', () => {
  let replaceSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    replaceSpy = vi.spyOn(window.location, 'replace').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    replaceSpy.mockRestore();
  });

  it('tests the target URL and navigates immediately when already unblocked', async () => {
    vi.mocked(MessagesService.sendMessage).mockResolvedValue({ ok: true, status: 'unblocked' });
    const { result } = renderHook(() => useNavigateOnUnblock(['rule-1'], 'https://example.com'));

    let status: string | undefined;
    await act(async () => {
      status = await result.current.testAndProceedToTargetUrl();
    });

    expect(MessagesService.sendMessage).toHaveBeenCalledWith({
      type: 'TEST_URL_REQUEST',
      payload: { targetUrl: 'https://example.com' },
    });
    expect(status).toBe('unblocked');
    expect(replaceSpy).toHaveBeenCalledWith('https://example.com');
  });

  it('unblocks and navigates once, while guarding against missing params', async () => {
    vi.mocked(MessagesService.sendMessage).mockResolvedValue({ ok: true });

    const valid = renderHook(() => useNavigateOnUnblock(['rule-1'], 'https://example.com'));
    await act(async () => {
      await valid.result.current.proceedToTargetUrl();
    });

    expect(MessagesService.sendMessage).toHaveBeenCalledWith({
      type: 'UNBLOCK_REQUEST',
      payload: { ruleIds: ['rule-1'], targetUrl: 'https://example.com' },
    });
    expect(replaceSpy).toHaveBeenCalledWith('https://example.com');

    const invalid = renderHook(() => useNavigateOnUnblock(null, null));
    await act(async () => {
      await invalid.result.current.proceedToTargetUrl();
    });

    expect(MessagesService.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('surfaces an error after five failed retries and stops retrying further', async () => {
    vi.useFakeTimers();
    vi.mocked(MessagesService.sendMessage).mockResolvedValue({ ok: false, reason: 'Still blocked' });
    const { result } = renderHook(() => useNavigateOnUnblock(['rule-1'], 'https://example.com'));

    for (let index = 0; index < 5; index += 1) {
      await act(async () => {
        await result.current.proceedToTargetUrl();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    expect(result.current.error).toBe('Still blocked');
    expect(MessagesService.sendMessage).toHaveBeenCalledTimes(5);

    await act(async () => {
      await result.current.proceedToTargetUrl();
    });

    expect(MessagesService.sendMessage).toHaveBeenCalledTimes(5);
  });
});
