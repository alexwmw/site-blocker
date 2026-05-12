import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SchedulingWindow from './SchedulingWindow';

import type { ScheduleWindow } from '@/types/schema';

const windowData: ScheduleWindow = {
  id: 'window-1',
  days: [true, false, false, false, false, false, false],
  start: '09:00',
  end: '17:00',
};

describe('SchedulingWindow', () => {
  it('defers persistence of typed time changes until blur', () => {
    const updateWindow = vi.fn(async () => {});

    render(
      <SchedulingWindow
        window={windowData}
        windowIndex={0}
        disabled={false}
        removeWindow={vi.fn(async () => {})}
        updateWindow={updateWindow}
      />,
    );

    const startInput = screen.getByLabelText('Start time') as HTMLInputElement;

    fireEvent.change(startInput, { target: { value: '19:19' } });

    expect(startInput.value).toBe('19:19');
    expect(updateWindow).not.toHaveBeenCalled();

    fireEvent.blur(startInput);

    expect(updateWindow).toHaveBeenCalledTimes(1);
    expect(updateWindow).toHaveBeenCalledWith({ start: '19:19' });
  });
});
