import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useCreateRuleFromTab from './useCreateRuleFromTab';

const chromeMock = {
  tabs: {
    query: vi.fn(),
  },
};
vi.stubGlobal('chrome', chromeMock);

describe('useCreateRuleFromActiveTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not query tabs if a tab argument is present', async () => {
    chromeMock.tabs.query.mockResolvedValue([{ url: 'https://www.reddit.com/r/aita' }]);

    const myTab = { url: 'https://www.theguardian.com/' };

    const { result } = renderHook(() => useCreateRuleFromTab(myTab as chrome.tabs.Tab));

    await waitFor(() => {
      expect(result.current.activeTab?.url).toBe('https://www.theguardian.com/');
    });

    expect(chromeMock.tabs.query).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.isResolved).toBe(true);
    expect(result.current.createDomainPrefixRule()?.pattern).toBe('theguardian.com');
  });

  it('does not query tabs when a provided tab is unsupported', async () => {
    chromeMock.tabs.query.mockResolvedValue([{ url: 'https://www.reddit.com/r/aita' }]);

    const myTab = { url: 'chrome://extensions' };

    const { result } = renderHook(() => useCreateRuleFromTab(myTab as chrome.tabs.Tab));

    await waitFor(() => {
      expect(result.current.activeTab?.url).toBe('chrome://extensions');
    });

    expect(chromeMock.tabs.query).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.isResolved).toBe(true);
  });

  it('loads active tab and marks supported URLs', async () => {
    chromeMock.tabs.query.mockResolvedValue([{ url: 'https://www.reddit.com/r/aita' }]);

    const { result } = renderHook(() => useCreateRuleFromTab());

    expect(result.current.isResolved).toBe(false);

    await waitFor(() => {
      expect(result.current.activeTab?.url).toBe('https://www.reddit.com/r/aita');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isResolved).toBe(true);
  });

  it('preserves query errors instead of treating them as empty loaded state', async () => {
    const queryError = new Error('failed to query tabs');
    chromeMock.tabs.query.mockRejectedValue(queryError);

    const { result } = renderHook(() => useCreateRuleFromTab());

    await waitFor(() => {
      expect(result.current.error).toBe(queryError);
    });

    expect(result.current.activeTab).toBeNull();
    expect(result.current.isResolved).toBe(true);
  });

  it('creates exact and prefix URL rules from active tab', async () => {
    chromeMock.tabs.query.mockResolvedValue([{ url: 'https://www.reddit.com/r/aita/' }]);

    const { result } = renderHook(() => useCreateRuleFromTab());

    await waitFor(() => {
      expect(result.current.activeTab?.url).toBe('https://www.reddit.com/r/aita/');
    });

    const exactRule = result.current.createExactUrlRule();
    const prefixRule = result.current.createPrefixUrlRule();

    expect(exactRule?.matchType).toBe('exact');
    expect(prefixRule?.matchType).toBe('prefix');
    expect(exactRule?.pattern).toBe('reddit.com/r/aita');
    expect(prefixRule?.pattern).toBe('reddit.com/r/aita');
    expect(exactRule?.enabled).toBe(true);
  });

  it('creates a domain prefix rule from active tab', async () => {
    chromeMock.tabs.query.mockResolvedValue([{ url: 'https://www.reddit.com/r/aita?sort=new' }]);

    const { result } = renderHook(() => useCreateRuleFromTab());

    await waitFor(() => {
      expect(result.current.activeTab?.url).toBe('https://www.reddit.com/r/aita?sort=new');
    });

    const rule = result.current.createDomainPrefixRule();

    expect(rule?.matchType).toBe('prefix');
    expect(rule?.pattern).toBe('reddit.com');
  });

  it('returns null rules for unsupported tab URLs', async () => {
    chromeMock.tabs.query.mockResolvedValue([{ url: 'chrome://extensions' }]);

    const { result } = renderHook(() => useCreateRuleFromTab());

    await waitFor(() => {
      expect(result.current.activeTab?.url).toBe('chrome://extensions');
    });

    expect(result.current.createExactUrlRule()).toBeNull();
    expect(result.current.createPrefixUrlRule()).toBeNull();
    expect(result.current.createDomainPrefixRule()).toBeNull();
  });
});
