import clsx from 'clsx';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import styles from '@/entries/options/OptionsApp.module.css';
import { SchedulingDays, SchedulingDaysPresetButtons } from '@/entries/options/tabs/scheduling/SchedulingDays';
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
    <li key={window.id}>
      <Card
        padding
        className={clsx(styles.scheduleWindowSettingsGrid, styles.scheduleWindowCard, disabled && styles.disabled)}
      >
        <div className={styles.scheduleWindowHeader}>
          <div>
            <strong>Schedule {windowIndex + 1}</strong>
            <p className={styles.subtle}>Recurring weekly block</p>
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
          />
          <SchedulingDays
            days={window.days}
            disabled={disabled}
            updateWindow={updateWindow}
            windowId={window.id}
          />
        </div>

        <label className={clsx(styles.settingsLabel, styles.scheduleWindowStart)}>
          Start time
          <input
            className={styles.settingsInput}
            type='time'
            step={900}
            value={window.start}
            disabled={disabled}
            onChange={(event) => {
              updateWindow({ start: event.target.value }).catch(console.error);
            }}
          />
        </label>

        <label className={clsx(styles.settingsLabel, styles.scheduleWindowEnd)}>
          End time
          <input
            className={styles.settingsInput}
            type='time'
            step={900}
            value={window.end}
            disabled={disabled}
            onChange={(event) => {
              updateWindow({ end: event.target.value }).catch(console.error);
            }}
          />
        </label>
      </Card>
    </li>
  );
};

export default SchedulingWindow;
