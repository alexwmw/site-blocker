import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IconsService } from './IconsService';
import { SchedulingService } from './SchedulingService';

import type { Schedule } from '@/types/schema';

const alarmsMock = {
  clear: vi.fn().mockResolvedValue(true),
  create: vi.fn().mockResolvedValue(undefined),
};

const actionMock = {
  setIcon: vi.fn().mockResolvedValue(undefined),
};

vi.stubGlobal('chrome', {
  alarms: alarmsMock,
  action: actionMock,
});

const buildSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  enabled: true,
  windows: [
    {
      id: '_initial',
      days: [true, true, true, true, true, true, true],
      start: '09:00',
      end: '10:00',
    },
  ],
  ...overrides,
});

describe('IconsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('schedules the next icon alarm when there is a next change', async () => {
    const nextChange = new Date('2026-01-12T09:00:00.000Z');
    vi.spyOn(SchedulingService, 'getNextChangeTime').mockReturnValue(nextChange);

    await IconsService.scheduleNextIconUpdate(buildSchedule());

    expect(alarmsMock.clear).toHaveBeenCalledWith('updateIcon');
    expect(alarmsMock.create).toHaveBeenCalledWith('updateIcon', { when: nextChange.getTime() });
  });

  it('does not create an icon alarm when there is no upcoming schedule change', async () => {
    vi.spyOn(SchedulingService, 'getNextChangeTime').mockReturnValue(null);

    await IconsService.scheduleNextIconUpdate(buildSchedule({ windows: [] }));

    expect(alarmsMock.clear).toHaveBeenCalledWith('updateIcon');
    expect(alarmsMock.create).not.toHaveBeenCalled();
  });
});
