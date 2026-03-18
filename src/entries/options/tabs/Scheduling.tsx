import { useMemo } from 'react';

import styles from '../OptionsApp.module.css';
import OptionsTab from '../OptionsTab';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Switch from '@/components/ui/Switch';
import SchedulingWindow from '@/entries/options/tabs/scheduling/SchedulingWindow';
import useSettings from '@/hooks/useSettings';
import type { ScheduleWindow } from '@/types/schema';

const Scheduling = ({ className }: { className: string }) => {
  const {
    settings,
    updateSettings,
    isLoading,
    addScheduleWindow,
    removeScheduleWindow,
    updateScheduleWindow,
    isSchedulingEnabled,
  } = useSettings();

  const schedule = useMemo(() => settings?.schedule, [settings]);

  const handleScheduleEnabledChange = (enabled: boolean) => {
    if (!schedule) {
      return;
    }
    updateSettings({
      schedule: {
        ...schedule,
        enabled,
      },
    }).catch(console.error);
  };

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
            handleScheduleEnabledChange(event.target.checked);
          }}
          disabled={!schedule}
          checked={Boolean(schedule?.enabled)}
          reverse
          tight
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
              disabled={!isSchedulingEnabled}
              onClick={() => {
                addScheduleWindow().catch(console.error);
              }}
            >
              Add new schedule window
            </Button>
          </div>

          <ul className={styles.windowsList}>
            {schedule.windows.map((win, index) => (
              <SchedulingWindow
                window={win}
                disabled={!schedule || !isSchedulingEnabled}
                windowIndex={index}
                removeWindow={() => removeScheduleWindow(win.id)}
                updateWindow={(update: Partial<ScheduleWindow>) => updateScheduleWindow(win.id, update)}
              />
            ))}
          </ul>
        </>
      ) : null}
    </OptionsTab>
  );
};

export default Scheduling;
