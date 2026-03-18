import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Scheduling from './Scheduling';

import type { Settings } from '@/types/schema';

const updateSettings = vi.fn();
const retryLoad = vi.fn();

const baseSettings: Settings = {
  blockPageHeadline: 'Stay on track',
  theme: 'mindful-light',
  holdDurationSeconds: 15,
  isRated: false,
  extendedUnblock: {
    enabled: true,
    durationMinutes: 10,
  },
  schedule: {
    enabled: true,
    windows: [
      {
        id: '_initial',
        days: [true, true, true, true, true, false, false],
        start: '09:00',
        end: '17:00',
      },
    ],
  },
};

const mockedUseSettings = vi.fn(() => ({
  settings: baseSettings,
  updateSettings,
  isLoading: false,
  error: null,
  retryLoad,
}));

vi.mock('@/hooks/useSettings', () => ({
  default: () => mockedUseSettings(),
}));

describe('Scheduling tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseSettings.mockReturnValue({
      settings: baseSettings,
      updateSettings,
      isLoading: false,
      error: null,
      retryLoad,
    });
  });

  it('shows a loading state while settings are loading', () => {
    mockedUseSettings.mockReturnValue({
      settings: null,
      updateSettings,
      isLoading: true,
      error: null,
      retryLoad,
    });

    render(<Scheduling className='test' />);

    expect(screen.getByText('Loading schedule windows…')).toBeTruthy();
  });

  it('shows an error state and allows retrying failed loads', () => {
    mockedUseSettings.mockReturnValue({
      settings: null,
      updateSettings,
      isLoading: false,
      error: 'boom',
      retryLoad,
    });

    render(<Scheduling className='test' />);

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByText("We couldn't load your scheduling settings.")).toBeTruthy();
    expect(retryLoad).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state when no windows are configured', () => {
    mockedUseSettings.mockReturnValue({
      settings: {
        ...baseSettings,
        schedule: {
          ...baseSettings.schedule,
          windows: [],
        },
      },
      updateSettings,
      isLoading: false,
      error: null,
      retryLoad,
    });

    render(<Scheduling className='test' />);

    expect(screen.getByText('No schedule windows yet.')).toBeTruthy();
  });

  it('surfaces overlap guidance as a warning instead of a blocking error', () => {
    mockedUseSettings.mockReturnValue({
      settings: {
        ...baseSettings,
        schedule: {
          enabled: true,
          windows: [
            {
              id: '_initial',
              days: [true, false, false, false, false, false, false],
              start: '09:00',
              end: '12:00',
            },
            {
              id: 'window-2',
              days: [true, false, false, false, false, false, false],
              start: '11:00',
              end: '13:00',
            },
          ],
        },
      },
      updateSettings,
      isLoading: false,
      error: null,
      retryLoad,
    });

    render(<Scheduling className='test' />);

    expect(screen.getByText('Heads up')).toBeTruthy();
    expect(screen.getAllByText(/Blocking will still work, but you may want to combine them/)[0]).toBeTruthy();
  });
});
