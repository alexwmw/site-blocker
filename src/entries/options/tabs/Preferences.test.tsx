import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Preferences from './Preferences';

import defaultSettings from '@/services/defaultSettings';

describe('Preferences', () => {
  it('does not render editable persisted-looking controls while settings are unresolved', () => {
    render(
      <Preferences
        className='preferences'
        settings={null}
        updateSettings={vi.fn(async () => {})}
      />,
    );

    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('spinbutton')).toBeNull();
  });

  it('renders ready settings values and forwards updates', () => {
    const updateSettings = vi.fn(async () => {});

    render(
      <Preferences
        className='preferences'
        settings={{ ...defaultSettings, theme: 'mindful-dark', holdDurationSeconds: 15 }}
        updateSettings={updateSettings}
      />,
    );

    const themeSelect = screen.getByRole('combobox');
    const holdDurationInput = screen.getByRole('spinbutton');

    expect((themeSelect as HTMLSelectElement).value).toBe('mindful-dark');
    expect((holdDurationInput as HTMLInputElement).value).toBe('15');

    fireEvent.change(themeSelect, { target: { value: 'focus-light' } });
    fireEvent.change(holdDurationInput, { target: { value: '25' } });

    expect(updateSettings).toHaveBeenNthCalledWith(1, { theme: 'focus-light' });
    expect(updateSettings).toHaveBeenNthCalledWith(2, { holdDurationSeconds: 25 });
  });
});
