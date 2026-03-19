import styles from '../OptionsApp.module.css';
import OptionsTab from '../OptionsTab';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Switch from '@/components/ui/Switch';
import SchedulingWindow from '@/entries/options/tabs/scheduling/SchedulingWindow';
import useSchedule from '@/hooks/useSchedule';
import type { ScheduleWindow } from '@/types/schema';

const Scheduling = ({ className }: { className: string }) => {
  const { schedule, isLoading, addScheduleWindow, removeScheduleWindow, updateScheduleWindow, setSchedulingEnabled } =
    useSchedule();

  return (
    <OptionsTab
      title='Scheduling'
      isContentLoaded={isLoading}
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
          disabled={!schedule}
          checked={schedule?.enabled}
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
      {!isLoading && schedule ? (
        <>
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
            {schedule.windows.map((win, index) => (
              <li key={win.id}>
                <SchedulingWindow
                  window={win}
                  disabled={!schedule || !schedule.enabled}
                  windowIndex={index}
                  removeWindow={() => removeScheduleWindow(win.id)}
                  updateWindow={(update: Partial<ScheduleWindow>) => updateScheduleWindow(win.id, update)}
                />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </OptionsTab>
  );
};

export default Scheduling;
