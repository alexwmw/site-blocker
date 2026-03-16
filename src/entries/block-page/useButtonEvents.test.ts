import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useButtonEvents from './useButtonEvents';

vi.mock('../../hooks/useSettings', () => ({
  default: () => ({
    settings: {
      holdDurationSeconds: 2,
    },
  }),
}));

describe('useButtonEvents', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('starts and clears a mouse hold countdown', () => {
    const play = vi.fn();
    const stop = vi.fn();
    const player = { current: { play, stop } };

    const { result } = renderHook(() => useButtonEvents(player));

    act(() => {
      result.current.onMouseDown({ button: 0 } as never);
    });

    expect(play).toHaveBeenCalledOnce();
    expect(result.current.timeRemaining).toBe(2);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.timeRemaining).toBe(1);

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(stop).toHaveBeenCalledOnce();
    expect(result.current.timeRemaining).toBeNull();
  });


  it('ignores duplicate mouse down while already holding', () => {
    const play = vi.fn();
    const stop = vi.fn();
    const player = { current: { play, stop } };

    const { result } = renderHook(() => useButtonEvents(player));

    act(() => {
      result.current.onMouseDown({ button: 0 } as never);
      result.current.onMouseDown({ button: 0 } as never);
    });

    expect(play).toHaveBeenCalledOnce();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.timeRemaining).toBe(1);
  });

  it('completes hold from space key press', () => {
    const play = vi.fn();
    const stop = vi.fn();
    const player = { current: { play, stop } };

    const { result } = renderHook(() => useButtonEvents(player));

    act(() => {
      result.current.onKeyDown({ key: ' ', code: 'Space' } as never);
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.timeRemaining).toBe(0);
  });
});
