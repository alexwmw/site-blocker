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
    listeners = [];

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
      expect(result.current.settings).toEqual(mockSettings);
    });

    expect(result.current.error).toBeNull();
  });

  it('should preserve load errors instead of treating them as loaded empty state', async () => {
    const loadError = new Error('failed to load settings');
    vi.spyOn(StorageService, 'getSettings').mockRejectedValue(loadError);

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.error).toBe(loadError);
    });

    expect(result.current.settings).toBeNull();
  });

  it('should update state when chrome.storage.onChanged fires', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.settings).toEqual(defaultSettings);
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
    expect(result.current.error).toBeNull();
  });

  it('should reject invalid chrome.storage.onChanged settings payloads', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.settings).toEqual(defaultSettings);
    });

    await act(async () => {
      expect(listeners).toHaveLength(1);
      listeners[0]({
        settings: {
          newValue: { ...defaultSettings, holdDurationSeconds: 'invalid' },
          oldValue: defaultSettings,
        },
      });
    });

    expect(result.current.settings).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
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
