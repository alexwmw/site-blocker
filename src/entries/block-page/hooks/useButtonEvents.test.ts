import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useButtonEvents from './useButtonEvents';

vi.mock('@/hooks/useSettings', () => ({
  default: () => ({ settings: { holdDurationSeconds: 5 } }),
}));

describe('useButtonEvents', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('clears held state when pointerup is fired on document', () => {
    const { result } = renderHook(() => useButtonEvents());

    act(() => {
      result.current.onMouseDown({ button: 0 } as unknown as MouseEvent);
    });

    expect(result.current.held).toBe(true);

    act(() => {
      document.dispatchEvent(new PointerEvent('pointerup'));
    });

    expect(result.current.held).toBe(false);
  });
});
