import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PopupApp from './PopupApp';

import useBlockRules from '@/hooks/useBlockRules';
import useCreateRuleFromTab from '@/hooks/useCreateRuleFromTab';
import useSettings from '@/hooks/useSettings';
import defaultSettings from '@/services/defaultSettings';
import { RulesService } from '@/services/RulesService';
import { SchedulingService } from '@/services/SchedulingService';

vi.mock('@/hooks/useThemeEffect', () => ({
  default: vi.fn(),
}));
vi.mock('@/hooks/useCreateRuleFromTab', () => ({
  default: vi.fn(),
}));
vi.mock('@/hooks/useBlockRules', () => ({
  default: vi.fn(),
}));
vi.mock('@/hooks/useSettings', () => ({
  default: vi.fn(),
}));
vi.mock('@/services/RulesService', () => ({
  RulesService: {
    isSupportedUrl: vi.fn(),
    findMatchingRules: vi.fn(),
    domainPatternFromUrl: vi.fn(),
    pathPatternFromUrl: vi.fn(),
  },
}));
vi.mock('@/services/SchedulingService', () => ({
  SchedulingService: {
    isBlockingActiveNow: vi.fn(),
  },
}));
vi.mock('@/services/blocking/getBlockPageUrl', () => ({
  getBlockPageUrl: vi.fn(() => 'chrome-extension://extension-id/block.html'),
}));

vi.stubGlobal('chrome', {
  runtime: {
    openOptionsPage: vi.fn(async () => {}),
  },
});

const createRuleHookResult = (overrides: Partial<ReturnType<typeof useCreateRuleFromTab>> = {}) => ({
  activeTab: { url: 'https://example.com' } as chrome.tabs.Tab,
  createDomainPrefixRule: vi.fn(() => null),
  createExactUrlRule: vi.fn(() => null),
  createPrefixUrlRule: vi.fn(() => null),
  error: null,
  isResolved: true,
  ...overrides,
});

describe('PopupApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useCreateRuleFromTab).mockReturnValue(createRuleHookResult());
    vi.mocked(useBlockRules).mockReturnValue({
      blockRules: [],
      addRule: vi.fn(async () => {}),
      error: null,
      removeRule: vi.fn(async () => {}),
      updateRule: vi.fn(async () => {}),
    });
    vi.mocked(useSettings).mockReturnValue({
      settings: defaultSettings,
      error: null,
      updateSettings: vi.fn(async () => {}),
    });
    vi.mocked(RulesService.isSupportedUrl).mockReturnValue(true);
    vi.mocked(RulesService.findMatchingRules).mockReturnValue([]);
    vi.mocked(RulesService.domainPatternFromUrl).mockReturnValue('example.com');
    vi.mocked(RulesService.pathPatternFromUrl).mockReturnValue('example.com/path?q=react');
    vi.mocked(SchedulingService.isBlockingActiveNow).mockReturnValue(true);
  });

  it('shows the shared loading boundary until popup data is fully resolved', () => {
    vi.mocked(useCreateRuleFromTab).mockReturnValue(
      createRuleHookResult({
        activeTab: null,
        isResolved: false,
      }),
    );

    const { container } = render(<PopupApp />);

    expect(container.querySelector('span')).toBeTruthy();
    expect(screen.queryByText('Blocking')).toBeNull();
  });

  it('shows an inline error when popup data loading fails', () => {
    vi.mocked(useCreateRuleFromTab).mockReturnValue(
      createRuleHookResult({
        activeTab: null,
        error: new Error('Failed to query tabs.'),
      }),
    );

    render(<PopupApp />);

    expect(screen.getByRole('alert').textContent).toContain('Failed to query tabs.');
    expect(screen.queryByText('Blocking')).toBeNull();
  });

  it('shows specific-page action label and cleaned rule preview', () => {
    render(<PopupApp />);

    expect(screen.getByText('Block this specific page')).toBeTruthy();
    expect(screen.getByText('example.com/path?q=react')).toBeTruthy();
  });

  it('creates an exact page rule from the specific-page action', () => {
    const createExactUrlRule = vi.fn(() => ({
      id: 'r1',
      pattern: 'example.com/path?q=react',
      matchType: 'exact' as const,
      createdAt: new Date().toISOString(),
      enabled: true,
    }));
    const createPrefixUrlRule = vi.fn(() => null);
    const addRule = vi.fn(async () => {});

    vi.mocked(useCreateRuleFromTab).mockReturnValue(
      createRuleHookResult({
        createExactUrlRule,
        createPrefixUrlRule,
      }),
    );
    vi.mocked(useBlockRules).mockReturnValue({
      blockRules: [],
      addRule,
      error: null,
      removeRule: vi.fn(async () => {}),
      updateRule: vi.fn(async () => {}),
    });

    render(<PopupApp />);
    fireEvent.click(screen.getByText('Block this specific page'));

    expect(createExactUrlRule).toHaveBeenCalledTimes(1);
    expect(createPrefixUrlRule).not.toHaveBeenCalled();
    expect(addRule).toHaveBeenCalledTimes(1);
  });
});
