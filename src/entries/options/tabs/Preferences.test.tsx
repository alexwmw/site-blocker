import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Preferences from './Preferences';

import { defaultPreferenceSettings, defaultSettings } from '@/services/defaultSettings';

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

  it('renders grouped settings values and forwards updates for each preference control', () => {
    const updateSettings = vi.fn(async () => {});

    render(
      <Preferences
        className='preferences'
        settings={{
          ...defaultSettings,
          theme: 'mindful-dark',
          holdDurationSeconds: 15,
          blockPageHeadline: 'Keep going',
          extendedUnblock: { enabled: true, durationMinutes: 10 },
          isRated: false,
        }}
        updateSettings={updateSettings}
      />,
    );

    expect(screen.getByText('Blocking behavior')).toBeTruthy();
    expect(screen.getByText('Appearance')).toBeTruthy();

    const themeSelect = screen.getAllByRole('combobox')[0];
    const modeSelect = screen.getAllByRole('combobox')[1];
    const spinbuttons = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    const holdDurationInput = spinbuttons[0];
    const unblockDurationInput = spinbuttons[1];
    const headlineInput = screen.getByRole('textbox', { name: /block page headline/i }) as HTMLInputElement;
    const [unblockEnabledSwitch] = screen.getAllByRole('checkbox') as HTMLInputElement[];

    expect((themeSelect as HTMLSelectElement).value).toBe('mindful');
    expect((modeSelect as HTMLSelectElement).value).toBe('dark');
    expect(holdDurationInput.value).toBe('15');
    expect(headlineInput.value).toBe('Keep going');
    expect(unblockDurationInput.value).toBe('10');
    expect(unblockEnabledSwitch.checked).toBe(true);

    fireEvent.change(themeSelect, { target: { value: 'focus' } });
    fireEvent.change(modeSelect, { target: { value: 'light' } });
    fireEvent.change(holdDurationInput, { target: { value: '25' } });
    fireEvent.change(headlineInput, { target: { value: 'Deep work only' } });
    fireEvent.click(unblockEnabledSwitch);
    fireEvent.change(unblockDurationInput, { target: { value: '45' } });

    expect(updateSettings).toHaveBeenNthCalledWith(1, { theme: 'focus-dark' });
    expect(updateSettings).toHaveBeenNthCalledWith(2, { theme: 'mindful-light' });
    expect(updateSettings).toHaveBeenNthCalledWith(3, { holdDurationSeconds: 25 });
    expect(updateSettings).toHaveBeenNthCalledWith(4, { blockPageHeadline: 'Deep work only' });
    expect(updateSettings).toHaveBeenNthCalledWith(5, {
      extendedUnblock: { enabled: false, durationMinutes: 10 },
    });
    expect(updateSettings).toHaveBeenNthCalledWith(6, {
      extendedUnblock: { enabled: true, durationMinutes: 45 },
    });
  });

  it('clamps invalid values and resets visible preferences to defaults', () => {
    const updateSettings = vi.fn(async () => {});

    render(
      <Preferences
        className='preferences'
        settings={{
          ...defaultSettings,
          holdDurationSeconds: 20,
          blockPageHeadline: 'Custom title',
          extendedUnblock: { enabled: true, durationMinutes: 12 },
          isRated: true,
        }}
        updateSettings={updateSettings}
      />,
    );

    const [holdDurationInput, unblockDurationInput] = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    const headlineInput = screen.getByRole('textbox', { name: /block page headline/i });

    fireEvent.change(holdDurationInput, { target: { value: '1' } });
    fireEvent.change(headlineInput, { target: { value: '   ' } });
    fireEvent.change(unblockDurationInput, { target: { value: '999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset preferences to defaults' }));

    expect(updateSettings).toHaveBeenNthCalledWith(1, { holdDurationSeconds: 3 });
    expect(updateSettings).toHaveBeenNthCalledWith(2, { blockPageHeadline: defaultSettings.blockPageHeadline });
    expect(updateSettings).toHaveBeenNthCalledWith(3, {
      extendedUnblock: { enabled: true, durationMinutes: 240 },
    });
    expect(updateSettings).toHaveBeenNthCalledWith(4, defaultPreferenceSettings);
  });
});
