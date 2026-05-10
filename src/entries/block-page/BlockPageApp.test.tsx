import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import BlockPageApp from './BlockPageApp';
import useBlockPageParams from './hooks/useBlockPageParams';
import useButtonEventHandlers from './hooks/useButtonEventHandlers';

import useSettings from '@/hooks/useSettings';
import useThemeEffect from '@/hooks/useThemeEffect';

vi.mock('./hooks/useBlockPageParams', () => ({
  default: vi.fn(),
}));
vi.mock('./hooks/useButtonEventHandlers', () => ({
  default: vi.fn(),
}));
vi.mock('./hooks/useNavigateOnUnblock', () => ({
  default: vi.fn(),
}));
vi.mock('@/hooks/useSettings', () => ({
  default: vi.fn(),
}));
vi.mock('@/hooks/useThemeEffect', () => ({
  default: vi.fn(),
}));
vi.mock('@/components/primitives/Card', () => ({
  default: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));
vi.mock('@/components/primitives/Stack', () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
}));
vi.mock('@/components/shared/EyebrowLabel', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/shared/SiteIdentity', () => ({
  default: () => <div>Site identity</div>,
}));
vi.mock('@/entries/block-page/components/BackgroundCredit', () => ({
  default: () => null,
}));
vi.mock('@/entries/block-page/components/QuickOptions', () => ({
  default: () => <div>Quick options</div>,
}));
vi.mock('@/entries/block-page/components/ReviewCard', () => ({
  default: () => <div>Review card</div>,
}));
vi.mock('@/entries/block-page/components/UpdatedBanner', () => ({
  default: () => <div>Updated banner</div>,
}));
vi.mock('@/services/SiteIdentityService', () => ({
  SiteIdentityService: {
    fromUrl: vi.fn(() => ({
      host: 'example.com',
      path: '/blocked',
      label: 'example.com/blocked',
      faviconSources: [],
    })),
  },
}));
vi.mock('@/utils/extensionUrls', () => ({
  getChromeWebStoreUrl: vi.fn(() => 'https://chromewebstore.google.com/detail/test'),
}));

const navigateHook = vi.hoisted(() => ({
  proceedToTargetUrl: vi.fn(async () => {}),
  testAndProceedToTargetUrl: vi.fn(async () => 'blocked'),
  error: undefined as string | undefined,
}));

vi.mock('./hooks/useNavigateOnUnblock', () => ({
  default: vi.fn(() => navigateHook),
}));

describe('BlockPageApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    vi.mocked(useThemeEffect).mockReturnValue('focus-dark');
    vi.mocked(useButtonEventHandlers).mockReturnValue({
      onMouseDown: vi.fn(),
      onKeyDown: vi.fn(),
      held: false,
      timeRemaining: null,
      resetTimer: () => {},
    });
    vi.mocked(useSettings).mockReturnValue({
      settings: {
        theme: 'focus-dark',
        holdDurationSeconds: 1,
        isRated: false,
        showMigrationBrief: false,
        blockPageHeadline: 'Stay on track',
        schedule: { enabled: false, windows: [] },
        extendedUnblock: { enabled: true, durationMinutes: 10 },
      },
      error: null,
      updateSettings: vi.fn(async () => {}),
    });
    vi.mocked(useBlockPageParams).mockReturnValue({
      ruleIds: ['rule-1'],
      patternHost: 'example.com',
      patternPath: '/blocked',
      matchType: 'prefix',
      targetUrl: 'https://example.com/blocked',
    });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rechecks the target URL when the page becomes visible', () => {
    render(<BlockPageApp />);

    fireEvent(document, new Event('visibilitychange'));

    expect(navigateHook.testAndProceedToTargetUrl).toHaveBeenCalledTimes(1);
  });

  it('completes the hold flow and proceeds only after release plus the UX delay', async () => {
    vi.mocked(useButtonEventHandlers).mockReturnValue({
      onMouseDown: vi.fn(),
      onKeyDown: vi.fn(),
      held: true,
      timeRemaining: 0,
      resetTimer: () => {},
    });

    const { rerender } = render(<BlockPageApp />);

    expect(navigateHook.proceedToTargetUrl).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    vi.mocked(useButtonEventHandlers).mockReturnValue({
      onMouseDown: vi.fn(),
      onKeyDown: vi.fn(),
      held: false,
      timeRemaining: 0,
      resetTimer: () => {},
    });
    rerender(<BlockPageApp />);

    expect(navigateHook.proceedToTargetUrl).toHaveBeenCalledTimes(1);
  });

  it('shows navigation errors instead of the normal hold prompt', () => {
    navigateHook.error = 'Still blocked';

    render(<BlockPageApp />);

    expect(screen.getByText('Still blocked')).toBeTruthy();
    expect(screen.queryByText('If you wish to proceed, hold the button.')).toBeNull();

    navigateHook.error = undefined;
  });
});
