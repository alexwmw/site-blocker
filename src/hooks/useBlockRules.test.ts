import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useBlockRules from './useBlockRules';

import { StorageService } from '@/services/StorageService';
import type { BlockRule } from '@/types/schema';

const DEFAULT_RULE: BlockRule = {
  id: '111',
  pattern: 'abc.com',
  matchType: 'prefix',
  enabled: true,
  createdAt: '2026-03-06T00:00:00.000Z',
};

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

describe('useBlockRules Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    listeners = []; // Reset listeners between tests

    chromeMock.storage.local.get.mockImplementation(async (key: string) => {
      return {
        [key]: [DEFAULT_RULE, { ...DEFAULT_RULE, id: '222' } as BlockRule, { ...DEFAULT_RULE, id: '333' } as BlockRule],
      };
    });
  });

  it('should load initial rules from StorageService', async () => {
    // const mockRules: BlockRule[] = [DEFAULT_RULE];
    // vi.spyOn(StorageService, 'getRules').mockResolvedValue(mockRules);

    const { result } = renderHook(() => useBlockRules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.blockRules?.[0].id).toBe('111');
    expect(result.current.blockRules?.[1].id).toBe('222');
    expect(result.current.blockRules?.length).toBe(3);
    expect(result.current.isLoading).toBe(false);
  });

  it('should update state when chrome.storage.onChanged fires', async () => {
    const { result } = renderHook(() => useBlockRules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      expect(listeners).toHaveLength(1);
      listeners[0]({
        rules: {
          newValue: [
            DEFAULT_RULE,
            { ...DEFAULT_RULE, id: '222' } as BlockRule,
            { ...DEFAULT_RULE, id: '333' } as BlockRule,
            { ...DEFAULT_RULE, id: '444' } as BlockRule,
          ],
          oldValue: [
            DEFAULT_RULE,
            { ...DEFAULT_RULE, id: '222' } as BlockRule,
            { ...DEFAULT_RULE, id: '333' } as BlockRule,
          ],
        },
      });
    });

    expect(result.current.blockRules?.length).toBe(4);
    expect(result.current.blockRules?.[3]?.id).toBe('444');
  });

  it('should call StorageService.addRule when addRule is called', async () => {
    const spy = vi.spyOn(StorageService, 'addRule').mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useBlockRules());

    await act(async () => {
      await result.current.addRule({ ...DEFAULT_RULE, id: 'new_rule' });
    });

    expect(spy).toHaveBeenCalledWith({ ...DEFAULT_RULE, id: 'new_rule' });
  });

  it('should call StorageService.removeRule when removeRule is called', async () => {
    const spy = vi.spyOn(StorageService, 'removeRule').mockResolvedValue();
    const { result } = renderHook(() => useBlockRules());

    await act(async () => {
      await result.current.removeRule('x');
    });

    expect(spy).toHaveBeenCalledWith('x');
  });

  it('should call StorageService.updateRule when updateRule is called', async () => {
    const spy = vi.spyOn(StorageService, 'updateRule').mockResolvedValue({ ...DEFAULT_RULE, id: 'x' });
    const { result } = renderHook(() => useBlockRules());

    await act(async () => {
      await result.current.updateRule('x', { matchType: 'exact' });
    });

    expect(spy).toHaveBeenCalledWith('x', { matchType: 'exact' });
  });
});
