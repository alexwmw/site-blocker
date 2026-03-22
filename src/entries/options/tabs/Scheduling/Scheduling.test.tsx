import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Scheduling from './';

import type { Schedule } from '@/types/schema';

const schedule: Schedule = {
  enabled: true,
  windows: [
    {
      id: 'window-1',
      days: [true, false, false, false, false, false, false],
      start: '09:00',
      end: '17:00',
    },
  ],
};

describe('Scheduling', () => {
  it('does not render editable scheduling controls while schedule is unresolved', () => {
    render(
      <Scheduling
        className='scheduling'
        schedule={null}
        addScheduleWindow={vi.fn(async () => {})}
        removeScheduleWindow={vi.fn(async () => {})}
        setSchedulingEnabled={vi.fn(async () => {})}
        updateScheduleWindow={vi.fn(async () => {})}
      />,
    );

    expect(screen.queryByRole('checkbox', { name: 'Enable scheduled blocking' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add new schedule window' })).toBeNull();
  });

  it('renders scheduling controls once schedule data is ready', () => {
    render(
      <Scheduling
        className='scheduling'
        schedule={schedule}
        addScheduleWindow={vi.fn(async () => {})}
        removeScheduleWindow={vi.fn(async () => {})}
        setSchedulingEnabled={vi.fn(async () => {})}
        updateScheduleWindow={vi.fn(async () => {})}
      />,
    );

    const schedulingToggle = screen.getByRole('checkbox', { name: 'Enable scheduled blocking' }) as HTMLInputElement;
    const addWindowButton = screen.getByRole('button', { name: 'Add new schedule window' }) as HTMLButtonElement;

    expect(schedulingToggle.checked).toBe(true);
    expect(addWindowButton.disabled).toBe(false);
    expect(screen.getByText('Schedule 1')).not.toBeNull();
  });
});
