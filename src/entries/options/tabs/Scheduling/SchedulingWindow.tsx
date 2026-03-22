import clsx from 'clsx';

import styles from './Scheduling.module.css';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Paragraph from '@/components/primitives/Paragraph';
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
  return (
    <Card
      padding
      className={clsx(styles.scheduleWindowSettingsGrid, styles.scheduleWindowCard, disabled && styles.disabled)}
    >
      <div className={styles.scheduleWindowHeader}>
        <div>
          <strong>Schedule {windowIndex + 1}</strong>
          <Paragraph subtle>Recurring weekly block</Paragraph>
        </div>
        {window.id !== '_initial' ? (
          <Button
            variant='ghost'
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
        <span className={styles.settingsLabel}>Repeat on</span>
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
          label='Start time'
          type='time'
          step={900}
          value={window.start}
          disabled={disabled}
          onChange={(event) => {
            updateWindow({ start: event.target.value }).catch(console.error);
          }}
        />
      </div>
      <div className={styles.scheduleWindowEnd}>
        <Setting
          label='End time'
          type='time'
          step={900}
          value={window.end}
          disabled={disabled}
          onChange={(event) => {
            updateWindow({ end: event.target.value }).catch(console.error);
          }}
        />
      </div>
    </Card>
  );
};

export default SchedulingWindow;
