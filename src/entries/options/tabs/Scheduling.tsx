import styles from '../OptionsApp.module.css';
import OptionsTab from '../OptionsTab';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Switch from '@/components/ui/Switch';
import SchedulingWindow from '@/entries/options/tabs/scheduling/SchedulingWindow';
import type { Schedule, ScheduleWindow } from '@/types/schema';

type SchedulingProps = {
  className: string;
  schedule: Schedule | null;
  addScheduleWindow: () => Promise<void>;
  removeScheduleWindow: (id: string) => Promise<void>;
  setSchedulingEnabled: (enabled: boolean) => Promise<void>;
  updateScheduleWindow: (id: string, updates: Partial<ScheduleWindow>) => Promise<void>;
};

const Scheduling = ({
  className,
  schedule,
  addScheduleWindow,
  removeScheduleWindow,
  setSchedulingEnabled,
  updateScheduleWindow,
}: SchedulingProps) => {
  return (
    <OptionsTab
      title='Scheduling'
      className={className}
    >
      <Card
        className={styles.settingsGrid}
        padding
      >
        <Switch
          id='scheduling_enabled'
          label='Enable scheduled blocking'
          onChange={(event) => {
            setSchedulingEnabled(event.target.checked).catch(console.error);
          }}
          checked={schedule?.enabled ?? false}
          reverse
          compact
        />
        <div className={styles.scheduleAssistiveCopy}>
          <p className={styles.subtle}>
            When this is off, blocking stays active all day. Turn it on to block only during the recurring windows
            below.
          </p>
        </div>
      </Card>

      <div className={styles.scheduleHeadingRow}>
        <div>
          <h3>Schedule windows</h3>
          <p className={styles.subtle}>Add weekly rules, adjust days and times, and set multiple schedules.</p>
        </div>
        <Button
          disabled={!schedule?.enabled}
          onClick={() => {
            addScheduleWindow().catch(console.error);
          }}
        >
          Add new schedule window
        </Button>
      </div>

      <ul className={styles.windowsList}>
        {schedule?.windows.map((win, index) => (
          <li key={win.id}>
            <SchedulingWindow
              window={win}
              disabled={!schedule?.enabled}
              windowIndex={index}
              removeWindow={() => removeScheduleWindow(win.id)}
              updateWindow={(update: Partial<ScheduleWindow>) => updateScheduleWindow(win.id, update)}
            />
          </li>
        ))}
      </ul>
    </OptionsTab>
  );
};

export default Scheduling;
