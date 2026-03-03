import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import defaultSettings from '../services/defaultSettings';
import { StorageService } from '../services/StorageService';
import type { Settings } from '../types/schema';

import useSettings from './useSettings';

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
    const mockSettings: Settings = { ...defaultSettings, theme: 'light' };
    vi.spyOn(StorageService, 'getSettings').mockResolvedValue(mockSettings);

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings?.theme).toBe('light');
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
          newValue: { ...defaultSettings, theme: 'dark' },
          oldValue: defaultSettings,
        },
      });
    });

    expect(result.current.settings?.theme).toBe('dark');
  });

  it('should call StorageService.updateSettings when updateSettings is called', async () => {
    const spy = vi.spyOn(StorageService, 'updateSettings').mockResolvedValue();
    const { result } = renderHook(() => useSettings());

    await act(async () => {
      await result.current.updateSettings({ theme: 'dark' });
    });

    expect(spy).toHaveBeenCalledWith({ theme: 'dark' });
  });
});
