import { render, screen } from '@testing-library/react';
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

describe('PopupApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useCreateRuleFromTab).mockReturnValue({
      activeTab: { url: 'https://example.com' } as chrome.tabs.Tab,
      createDomainPrefixRule: vi.fn(() => null),
      createPrefixUrlRule: vi.fn(() => null),
      error: null,
      isResolved: true,
    });
    vi.mocked(useBlockRules).mockReturnValue({
      blockRules: [],
      addRule: vi.fn(async () => ({ ok: true })),
      error: null,
      removeRule: vi.fn(async () => {}),
      updateRule: vi.fn(async () => null),
    });
    vi.mocked(useSettings).mockReturnValue({
      settings: defaultSettings,
      error: null,
      updateSettings: vi.fn(async () => {}),
    });
    vi.mocked(RulesService.isSupportedUrl).mockReturnValue(true);
    vi.mocked(RulesService.findMatchingRules).mockReturnValue([]);
    vi.mocked(SchedulingService.isBlockingActiveNow).mockReturnValue(true);
  });

  it('shows the shared loading boundary until popup data is fully resolved', () => {
    vi.mocked(useCreateRuleFromTab).mockReturnValue({
      activeTab: null,
      createDomainPrefixRule: vi.fn(() => null),
      createPrefixUrlRule: vi.fn(() => null),
      error: null,
      isResolved: false,
    });

    const { container } = render(<PopupApp />);

    expect(container.querySelector('span')).toBeTruthy();
    expect(screen.queryByText('Blocking')).toBeNull();
  });

  it('shows an inline error when popup data loading fails', () => {
    vi.mocked(useCreateRuleFromTab).mockReturnValue({
      activeTab: null,
      createDomainPrefixRule: vi.fn(() => null),
      createPrefixUrlRule: vi.fn(() => null),
      error: new Error('Failed to query tabs.'),
      isResolved: true,
    });

    render(<PopupApp />);

    expect(screen.getByRole('alert').textContent).toContain('Failed to query tabs.');
    expect(screen.queryByText('Blocking')).toBeNull();
  });
});
