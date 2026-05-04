import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import useButtonEventHandlers from './useButtonEventHandlers';

describe('useButtonEventHandlers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts on left-click and resets when released early', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useButtonEventHandlers(2));

    act(() => {
      result.current.onMouseDown({ button: 0 } as React.MouseEvent);
    });

    expect(result.current.held).toBe(true);
    expect(result.current.timeRemaining).toBe(2);

    act(() => {
      vi.advanceTimersByTime(1000);
      document.dispatchEvent(new Event('pointerup'));
    });

    expect(result.current.held).toBe(false);
    expect(result.current.timeRemaining).toBeNull();
  });

  it('ignores non-left mouse buttons and starts with the space key once', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useButtonEventHandlers(2));

    act(() => {
      result.current.onMouseDown({ button: 1 } as React.MouseEvent);
    });
    expect(result.current.held).toBe(false);

    act(() => {
      result.current.onKeyDown({ key: ' ', code: 'Space' } as React.KeyboardEvent);
    });

    expect(result.current.held).toBe(true);
    expect(result.current.timeRemaining).toBe(2);

    act(() => {
      result.current.onKeyDown({ key: ' ', code: 'Space' } as React.KeyboardEvent);
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.timeRemaining).toBe(1);
  });

  it('preserves success when released after the hold completes', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useButtonEventHandlers(1));

    act(() => {
      result.current.onMouseDown({ button: 0 } as React.MouseEvent);
      vi.advanceTimersByTime(1000);
      document.dispatchEvent(new Event('pointerup'));
    });

    expect(result.current.held).toBe(false);
    expect(result.current.timeRemaining).toBe(0);
  });
});
