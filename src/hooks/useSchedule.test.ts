import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useSchedule from './useSchedule';

import useSettings from '@/hooks/useSettings';
import defaultSettings from '@/services/defaultSettings';
import { StorageService } from '@/services/StorageService';
import type { ScheduleWindow } from '@/types/schema';

vi.mock('@/hooks/useSettings', () => ({
  default: vi.fn(),
}));

vi.mock('@/services/StorageService', () => ({
  StorageService: {
    addScheduleWindow: vi.fn(),
    removeScheduleWindow: vi.fn(),
    updateScheduleWindow: vi.fn(),
  },
}));

describe('useSchedule', () => {
  const mockUpdateSettings = vi.fn().mockImplementation(async () => {});

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useSettings).mockReturnValue({
      settings: {
        ...defaultSettings,
        schedule: {
          ...defaultSettings.schedule,
          enabled: false,
          windows: [
            {
              id: 'window-1',
              days: [true, false, false, false, false, false, false],
              start: '09:00',
              end: '17:00',
            },
          ],
        },
      },
      error: null,
      updateSettings: mockUpdateSettings,
    });
  });

  it('returns the schedule from settings', () => {
    const { result } = renderHook(() => useSchedule());

    expect(result.current.schedule).toEqual({
      ...defaultSettings.schedule,
      enabled: false,
      windows: [
        {
          id: 'window-1',
          days: [true, false, false, false, false, false, false],
          start: '09:00',
          end: '17:00',
        },
      ],
    });
    expect(result.current.error).toBeNull();
  });

  it('returns unresolved state when settings are not loaded yet', () => {
    vi.mocked(useSettings).mockReturnValue({
      settings: null,
      error: null,
      updateSettings: mockUpdateSettings,
    });

    const { result } = renderHook(() => useSchedule());

    expect(result.current.schedule).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns settings load errors', () => {
    const loadError = new Error('schedule failed');
    vi.mocked(useSettings).mockReturnValue({
      settings: null,
      error: loadError,
      updateSettings: mockUpdateSettings,
    });

    const { result } = renderHook(() => useSchedule());

    expect(result.current.schedule).toBeNull();
    expect(result.current.error).toBe(loadError);
  });

  it('does not update scheduling enabled state before settings are ready', async () => {
    vi.mocked(useSettings).mockReturnValue({
      settings: null,
      error: null,
      updateSettings: mockUpdateSettings,
    });

    const { result } = renderHook(() => useSchedule());

    await act(async () => {
      await result.current.setSchedulingEnabled(true);
    });

    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });

  it('calls updateSettings when setSchedulingEnabled is called', async () => {
    const { result } = renderHook(() => useSchedule());

    await act(async () => {
      await result.current.setSchedulingEnabled(true);
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      schedule: {
        ...defaultSettings.schedule,
        enabled: true,
        windows: [
          {
            id: 'window-1',
            days: [true, false, false, false, false, false, false],
            start: '09:00',
            end: '17:00',
          },
        ],
      },
    });
  });

  it('calls StorageService.addScheduleWindow and creates an empty schedule window when no window is provided', async () => {
    vi.mocked(StorageService.addScheduleWindow).mockImplementation(async () => ({ ok: true }));

    const { result } = renderHook(() => useSchedule());

    await act(async () => {
      await result.current.addScheduleWindow();
    });

    expect(StorageService.addScheduleWindow).toHaveBeenCalledWith({
      id: expect.any(String),
      days: [false, false, false, false, false, false, false],
      start: '09:00',
      end: '17:00',
    });
  });

  it('calls StorageService.addScheduleWindow with the provided window', async () => {
    vi.mocked(StorageService.addScheduleWindow).mockImplementation(async () => ({ ok: true }));

    const customWindow: ScheduleWindow = {
      id: 'window-2',
      days: [false, true, false, true, false, false, false],
      start: '10:00',
      end: '15:00',
    };

    const { result } = renderHook(() => useSchedule());

    await act(async () => {
      await result.current.addScheduleWindow(customWindow);
    });

    expect(StorageService.addScheduleWindow).toHaveBeenCalledWith(customWindow);
  });

  it('calls StorageService.removeScheduleWindow with the given id', async () => {
    vi.mocked(StorageService.removeScheduleWindow).mockImplementation(async () => {});

    const { result } = renderHook(() => useSchedule());

    await act(async () => {
      await result.current.removeScheduleWindow('window-1');
    });

    expect(StorageService.removeScheduleWindow).toHaveBeenCalledWith('window-1');
  });

  it('calls StorageService.updateScheduleWindow with id and updates', async () => {
    vi.mocked(StorageService.updateScheduleWindow).mockImplementation(async () => defaultSettings.schedule.windows[0]);

    const updates: Partial<ScheduleWindow> = {
      start: '08:30',
      end: '16:30',
    };

    const { result } = renderHook(() => useSchedule());

    await act(async () => {
      await result.current.updateScheduleWindow('window-1', updates);
    });

    expect(StorageService.updateScheduleWindow).toHaveBeenCalledWith('window-1', updates);
  });
});
