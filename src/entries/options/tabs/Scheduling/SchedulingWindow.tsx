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

  useEffect(() => {
    setStartValue(window.start);
    setEndValue(window.end);
  }, [window.start, window.end]);

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
            setStartValue(event.target.value);
          }}
          onBlur={() => {
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
            setEndValue(event.target.value);
          }}
          onBlur={() => {
            if (endValue !== window.end) {
              updateWindow({ end: endValue }).catch(console.error);
            }
          }}
        />
      </div>
    </Card>
  );
};

export default SchedulingWindow;
