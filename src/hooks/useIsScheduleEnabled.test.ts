import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useIsScheduleEnabled from './useIsScheduleEnabled';

import useSchedule from '@/hooks/useSchedule';
import defaultSettings from '@/services/defaultSettings';

vi.mock('@/hooks/useSchedule', () => ({
  default: vi.fn(),
}));

describe('useIsScheduleEnabled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when the loaded schedule is enabled', () => {
    vi.mocked(useSchedule).mockReturnValue({
      schedule: { ...defaultSettings.schedule, enabled: true },
      error: null,
      setSchedulingEnabled: vi.fn(),
      addScheduleWindow: vi.fn(),
      removeScheduleWindow: vi.fn(),
      updateScheduleWindow: vi.fn(),
    });

    const { result } = renderHook(() => useIsScheduleEnabled());

    expect(result.current).toBe(true);
  });

  it('returns false when the schedule is unresolved', () => {
    vi.mocked(useSchedule).mockReturnValue({
      schedule: null,
      error: null,
      setSchedulingEnabled: vi.fn(),
      addScheduleWindow: vi.fn(),
      removeScheduleWindow: vi.fn(),
      updateScheduleWindow: vi.fn(),
    });

    const { result } = renderHook(() => useIsScheduleEnabled());

    expect(result.current).toBe(false);
  });
});
