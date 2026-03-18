import clsx from 'clsx';

import styles from '../OptionsApp.module.css';
import OptionsTab from '../OptionsTab';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Switch from '@/components/ui/Switch';
import useSettings from '@/hooks/useSettings';
import type { ScheduleWindow } from '@/types/schema';

const SCHEDULE_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const Scheduling = ({ className }: { className: string }) => {
  const {
    settings,
    updateSettings,
    isLoading: isSettingsLoading,
    updateScheduleWindow,
    addScheduleWindow,
    removeScheduleWindow,
  } = useSettings();

  const handleScheduleEnabledChange = (enabled: boolean) => {
    if (!settings) {
      return;
    }

    updateSettings({
      schedule: {
        ...settings.schedule,
        enabled,
      },
    }).catch(console.error);
  };

  const handleScheduleWindowChange = async (window: ScheduleWindow, updates: Partial<ScheduleWindow>) => {
    await updateScheduleWindow(window.id, updates);
  };

  const handleScheduleDayToggle = (window: ScheduleWindow, dayIndex: number, checked: boolean) => {
    if (!settings || settings.schedule.windows.length === 0) {
      return;
    }

    const nextDays = [...window.days] as typeof window.days;
    nextDays[dayIndex] = checked;

    updateScheduleWindow(window.id, { days: nextDays }).catch(console.error);
  };

  const renderWindows = (window: ScheduleWindow, windowIndex: number) => {
    const disabled = !settings || !settings.schedule.enabled;
    return (
      <li key={windowIndex}>
        <Card
          padding
          className={clsx(styles.settingsGrid, disabled && styles.disabled)}
        >
          <div className={styles.settingsLabel}>
            Active days
            <div className={styles.dayGrid}>
              {SCHEDULE_DAY_LABELS.map((day, index) => (
                <label
                  key={day}
                  className={styles.dayChip}
                >
                  <input
                    type='checkbox'
                    checked={Boolean(window.days[index])}
                    disabled={disabled}
                    onChange={(event) => {
                      handleScheduleDayToggle(window, index, event.target.checked);
                    }}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>
          <label className={styles.settingsLabel}>
            Start time
            <input
              className={styles.settingsInput}
              type='time'
              value={window.start ?? '09:00'}
              disabled={disabled}
              onChange={(event) => {
                handleScheduleWindowChange(window, { start: event.target.value }).catch(console.error);
              }}
            />
          </label>
          <label className={styles.settingsLabel}>
            End time
            <input
              className={styles.settingsInput}
              type='time'
              value={window.end ?? '17:00'}
              disabled={disabled}
              onChange={(event) => {
                handleScheduleWindowChange(window, { end: event.target.value }).catch(console.error);
              }}
            />
          </label>
          <span>
            {window.id !== '_initial' ? (
              <Button
                onClick={() => {
                  removeScheduleWindow(window.id).catch(console.error);
                }}
              >
                Remove schedule window
              </Button>
            ) : null}
          </span>
        </Card>
      </li>
    );
  };

  return (
    <OptionsTab
      title='Scheduling'
      isContentLoaded={isSettingsLoading}
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
          disabled={!settings}
          checked={Boolean(settings?.schedule.enabled)}
          reverse
          tight
        />
      </Card>
      <h3>Schedule windows</h3>
      <ul className={styles.windowsList}>{settings?.schedule.windows.map(renderWindows)}</ul>
      <div className={styles.windowListButtonRow}>
        <Button
          onClick={() => {
            addScheduleWindow().catch(console.error);
          }}
        >
          Add new schedule window
        </Button>
      </div>
    </OptionsTab>
  );
};

export default Scheduling;
