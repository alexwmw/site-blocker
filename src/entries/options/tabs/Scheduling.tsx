import Card from '../../../components/ui/Card';
import useSettings from '../../../hooks/useSettings';
import type { ScheduleWindow } from '../../../types/schema';
import styles from '../OptionsApp.module.css';
import OptionsTab from '../OptionsTab';

const SCHEDULE_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const Scheduling = ({ className }: { className: string }) => {
  const { settings, updateSettings, isLoading: isSettingsLoading } = useSettings();

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

  const handleScheduleWindowChange = (updates: Partial<ScheduleWindow>) => {
    if (!settings || settings.schedule.windows.length === 0) {
      return;
    }

    const [firstWindow, ...rest] = settings.schedule.windows;
    updateSettings({
      schedule: {
        ...settings.schedule,
        windows: [{ ...firstWindow, ...updates }, ...rest],
      },
    }).catch(console.error);
  };

  const handleScheduleDayToggle = (dayIndex: number, checked: boolean) => {
    if (!settings || settings.schedule.windows.length === 0) {
      return;
    }

    const [firstWindow, ...rest] = settings.schedule.windows;
    const nextDays = [...firstWindow.days] as typeof firstWindow.days;
    nextDays[dayIndex] = checked;

    updateSettings({
      schedule: {
        ...settings.schedule,
        windows: [{ ...firstWindow, days: nextDays }, ...rest],
      },
    }).catch(console.error);
  };

  return (
    <OptionsTab
      title='Scheduling'
      isContentLoaded={isSettingsLoading}
      className={className}
    >
      <Card className={styles.settingsGrid}>
        <label className={styles.checkboxLabel}>
          <input
            type='checkbox'
            checked={Boolean(settings?.schedule.enabled)}
            disabled={!settings}
            onChange={(event) => {
              handleScheduleEnabledChange(event.target.checked);
            }}
          />
          Enable scheduled blocking
        </label>

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
                  checked={Boolean(settings?.schedule.windows[0]?.days[index])}
                  disabled={!settings}
                  onChange={(event) => {
                    handleScheduleDayToggle(index, event.target.checked);
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
            value={settings?.schedule.windows[0]?.start ?? '09:00'}
            disabled={!settings}
            onChange={(event) => {
              handleScheduleWindowChange({ start: event.target.value });
            }}
          />
        </label>

        <label className={styles.settingsLabel}>
          End time
          <input
            className={styles.settingsInput}
            type='time'
            value={settings?.schedule.windows[0]?.end ?? '17:00'}
            disabled={!settings}
            onChange={(event) => {
              handleScheduleWindowChange({ end: event.target.value });
            }}
          />
        </label>
      </Card>
    </OptionsTab>
  );
};

export default Scheduling;
