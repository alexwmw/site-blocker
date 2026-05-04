import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import useHoldTimer from './useHoldTimer';

describe('useHoldTimer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down to zero once started', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useHoldTimer(2));

    act(() => {
      result.current.start();
    });

    expect(result.current.timeRemaining).toBe(2);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.timeRemaining).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.timeRemaining).toBe(0);
  });

  it('ignores duplicate starts and stops the active interval cleanly', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useHoldTimer(3));

    act(() => {
      result.current.start();
      result.current.start();
      vi.advanceTimersByTime(1000);
      result.current.stop();
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.timeRemaining).toBe(2);
  });

  it('does not start when duration is null and can be reset', () => {
    const { result } = renderHook(() => useHoldTimer(null));

    act(() => {
      result.current.start();
    });

    expect(result.current.timeRemaining).toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.timeRemaining).toBeNull();
  });
});
