import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useSettings from './useSettings';

import defaultSettings from '@/services/defaultSettings';
import { StorageService } from '@/services/StorageService';
import type { Settings } from '@/types/schema';

// Mock Chrome API
let listeners: Array<(changes: unknown) => void> = [];
const chromeMock = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn((fn) => listeners.push(fn)),
      removeListener: vi.fn(),
    },
  },
};
vi.stubGlobal('chrome', chromeMock);

describe('useSettings Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    listeners = []; // Reset listeners between tests

    chromeMock.storage.local.get.mockImplementation(async (key: string) => {
      return {
        [key]: defaultSettings,
      };
    });
  });

  it('should load initial settings from StorageService', async () => {
    const mockSettings: Settings = { ...defaultSettings, theme: 'mindful-light' };
    vi.spyOn(StorageService, 'getSettings').mockResolvedValue(mockSettings);

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings?.theme).toBe('mindful-light');
    expect(result.current.isLoading).toBe(false);
  });

  it('should update state when chrome.storage.onChanged fires', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      expect(listeners).toHaveLength(1);
      listeners[0]({
        settings: {
          newValue: { ...defaultSettings, theme: 'mindful-dark' },
          oldValue: defaultSettings,
        },
      });
    });

    expect(result.current.settings?.theme).toBe('mindful-dark');
  });

  it('should expose loading errors and support retrying', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const loadSpy = vi
      .spyOn(StorageService, 'getSettings')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(defaultSettings);

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.error).toBe('boom');
    });

    await act(async () => {
      await result.current.retryLoad();
    });

    expect(loadSpy).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
    expect(result.current.settings).toEqual(defaultSettings);
  });

  it('should call StorageService.updateSettings when updateSettings is called', async () => {
    const spy = vi.spyOn(StorageService, 'updateSettings').mockResolvedValue();
    const { result } = renderHook(() => useSettings());

    await act(async () => {
      await result.current.updateSettings({ theme: 'mindful-dark' });
    });

    expect(spy).toHaveBeenCalledWith({ theme: 'mindful-dark' });
  });
});
