import type { ChangeEvent } from 'react';

import styles from './Scheduling.module.css';

import Button from '@/components/primitives/Button';
import type { ScheduleDays, ScheduleWindow } from '@/types/schema';

const SCHEDULE_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const QUICK_DAY_PRESETS: Array<{ label: string; days: ScheduleDays }> = [
  { label: 'Weekdays', days: [true, true, true, true, true, false, false] },
  { label: 'Weekends', days: [false, false, false, false, false, true, true] },
  { label: 'Every day', days: [true, true, true, true, true, true, true] },
];

type SchedulingDaysProps = {
  days: boolean[];
  disabled: boolean;
  updateWindow: (update: Partial<ScheduleWindow>) => Promise<void>;
  windowId: string;
};

type SchedulingDaysPresetButtonsProps = {
  disabled: boolean;
  updateWindow: (update: Partial<ScheduleWindow>) => Promise<void>;
  days: ScheduleDays;
};

const isMatchingDays = (days1: ScheduleDays, days2: ScheduleDays) => {
  return days1.every((day, i) => days2[i] === day);
};

export const SchedulingDaysPresetButtons = ({ updateWindow, disabled, days }: SchedulingDaysPresetButtonsProps) => {
  return (
    <div className={styles.presetRow}>
      {QUICK_DAY_PRESETS.map((preset) => (
        <Button
          key={preset.label}
          variant='secondary'
          disabled={disabled}
          onClick={() => {
            updateWindow({ days: preset.days }).catch(console.error);
          }}
          selected={isMatchingDays(days, preset.days)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
};

export const SchedulingDays = ({ windowId, days, updateWindow, disabled }: SchedulingDaysProps) => {
  return (
    <div className={styles.dayGrid}>
      {SCHEDULE_DAY_LABELS.map((day, index) => {
        const handleDayToggle = (event: ChangeEvent<HTMLInputElement>) => {
          const nextDays = [...days] as ScheduleDays;
          nextDays[index] = event.target.checked;
          updateWindow({ days: nextDays }).catch(console.error);
        };
        return (
          <label
            key={`${windowId}-${day}`}
            className={styles.dayChip}
          >
            <input
              type='checkbox'
              checked={Boolean(days[index])}
              disabled={disabled}
              onChange={handleDayToggle}
            />
            {day}
          </label>
        );
      })}
    </div>
  );
};
