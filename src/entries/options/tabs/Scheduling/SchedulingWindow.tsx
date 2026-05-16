import clsx from 'clsx';
import { useEffect, useState } from 'react';

import styles from './Scheduling.module.css';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Setting from '@/components/primitives/Setting';
import { SchedulingDays, SchedulingDaysPresetButtons } from '@/entries/options/tabs/Scheduling/SchedulingDays';
import type { ScheduleWindow } from '@/types/schema';

type SchedulingWindowProps = {
  window: ScheduleWindow;
  disabled: boolean;
  windowIndex: number;
  removeWindow: () => Promise<void>;
  updateWindow: (update: Partial<ScheduleWindow>) => Promise<void>;
};

const SchedulingWindow = ({ window, windowIndex, disabled, removeWindow, updateWindow }: SchedulingWindowProps) => {
  const [startValue, setStartValue] = useState(window.start);
  const [endValue, setEndValue] = useState(window.end);
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    setStartValue(window.start);
    setEndValue(window.end);
    setTimeError(null);
  }, [window.start, window.end]);

  const isRangeValid = (start: string, end: string) => start < end;

  const validateRange = (start: string, end: string): boolean => {
    if (!isRangeValid(start, end)) {
      setTimeError('End time must be later than start time.');
      return false;
    }

    setTimeError(null);
    return true;
  };

  return (
    <Card
      padding
      className={clsx(styles.scheduleWindowSettingsGrid, styles.scheduleWindowCard, disabled && styles.disabled)}
    >
      <div className={styles.scheduleWindowHeader}>
        <div>
          <strong>Schedule {windowIndex + 1}</strong>
        </div>
        {window.id !== '_initial' ? (
          <Button
            variant='danger'
            disabled={disabled}
            onClick={() => {
              removeWindow().catch(console.error);
            }}
          >
            Remove
          </Button>
        ) : null}
      </div>

      <div className={styles.scheduleWindowDays}>
        <SchedulingDaysPresetButtons
          disabled={disabled}
          updateWindow={updateWindow}
          days={window.days}
        />
        <SchedulingDays
          days={window.days}
          disabled={disabled}
          updateWindow={updateWindow}
          windowId={window.id}
        />
      </div>
      <div className={styles.scheduleWindowStart}>
        <Setting
          settingId='startTime'
          label='Start time'
          type='time'
          value={startValue}
          disabled={disabled}
          onChange={(event) => {
            const nextStart = event.target.value;
            setStartValue(nextStart);
            validateRange(nextStart, endValue);
          }}
          onBlur={() => {
            if (!validateRange(startValue, endValue)) {
              return;
            }
            if (startValue !== window.start) {
              updateWindow({ start: startValue }).catch(console.error);
            }
          }}
        />
      </div>
      <div className={styles.scheduleWindowEnd}>
        <Setting
          settingId='endTime'
          label='End time'
          type='time'
          value={endValue}
          disabled={disabled}
          onChange={(event) => {
            const nextEnd = event.target.value;
            setEndValue(nextEnd);
            validateRange(startValue, nextEnd);
          }}
          onBlur={() => {
            if (!validateRange(startValue, endValue)) {
              return;
            }
            if (endValue !== window.end) {
              updateWindow({ end: endValue }).catch(console.error);
            }
          }}
          fieldHint={timeError ?? undefined}
        />
      </div>
    </Card>
  );
};

export default SchedulingWindow;
