import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';

import styles from '../OptionsApp.module.css';
import OptionsTab from '../OptionsTab';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Switch from '@/components/ui/Switch';
import useSettings from '@/hooks/useSettings';
import { SchedulingService } from '@/services/SchedulingService';
import type { Schedule, ScheduleDays, ScheduleWindow } from '@/types/schema';

const SCHEDULE_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const TIME_STEP_MINUTES = 15;
const TIME_OPTIONS = Array.from({ length: Math.floor((24 * 60) / TIME_STEP_MINUTES) }, (_, index) =>
  SchedulingService.minutesToTime(index * TIME_STEP_MINUTES),
);

const QUICK_DAY_PRESETS: Array<{ label: string; days: ScheduleDays }> = [
  { label: 'Weekdays', days: [true, true, true, true, true, false, false] },
  { label: 'Weekends', days: [false, false, false, false, false, true, true] },
  { label: 'Every day', days: [true, true, true, true, true, true, true] },
];

const buildUpdatedSchedule = (schedule: Schedule, windowId: string, updates: Partial<ScheduleWindow>): Schedule => ({
  ...schedule,
  windows: schedule.windows.map((window) => (window.id === windowId ? { ...window, ...updates } : window)),
});

const Scheduling = ({ className }: { className: string }) => {
  const { settings, updateSettings, isLoading, error, retryLoad } = useSettings();
  const [draftSchedule, setDraftSchedule] = useState<Schedule | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingWindowIds, setSavingWindowIds] = useState<string[]>([]);
  const [isSavingToggle, setIsSavingToggle] = useState(false);

  useEffect(() => {
    if (settings?.schedule) {
      setDraftSchedule(settings.schedule);
      setSaveError(null);
    }
  }, [settings]);

  const schedule = draftSchedule ?? settings?.schedule ?? null;
  const timezoneLabel = useMemo(() => SchedulingService.formatTimezoneLabel(), []);
  const warnings = useMemo(() => (schedule ? SchedulingService.getWarnings(schedule) : []), [schedule]);
  const hasWindows = Boolean(schedule && schedule.windows.length > 0);

  const persistSchedule = async (nextSchedule: Schedule, targetWindowId?: string) => {
    setDraftSchedule(nextSchedule);
    setSaveError(null);

    if (targetWindowId) {
      setSavingWindowIds((current) => [...new Set([...current, targetWindowId])]);
    }

    try {
      await updateSettings({ schedule: nextSchedule });
    } catch (persistError) {
      console.error(persistError);
      setSaveError(persistError instanceof Error ? persistError.message : 'Unable to save schedule changes.');
    } finally {
      if (targetWindowId) {
        setSavingWindowIds((current) => current.filter((id) => id !== targetWindowId));
      }
    }
  };

  const handleScheduleEnabledChange = async (enabled: boolean) => {
    if (!schedule) {
      return;
    }

    setIsSavingToggle(true);
    try {
      await updateSettings({
        schedule: {
          ...schedule,
          enabled,
        },
      });
      setDraftSchedule((current) => (current ? { ...current, enabled } : current));
      setSaveError(null);
    } catch (persistError) {
      console.error(persistError);
      setSaveError(persistError instanceof Error ? persistError.message : 'Unable to update scheduled blocking.');
    } finally {
      setIsSavingToggle(false);
    }
  };

  const addWindow = async () => {
    if (!schedule) {
      return;
    }

    const newWindow: ScheduleWindow = {
      id: crypto.randomUUID(),
      days: [true, true, true, true, true, false, false],
      start: '09:00',
      end: '17:00',
    };

    await persistSchedule(
      {
        ...schedule,
        windows: [...schedule.windows, newWindow],
      },
      newWindow.id,
    );
  };

  const removeWindow = async (windowId: string) => {
    if (!schedule || windowId === '_initial') {
      return;
    }

    await persistSchedule(
      {
        ...schedule,
        windows: schedule.windows.filter((window) => window.id !== windowId),
      },
      windowId,
    );
  };

  const updateWindow = async (windowId: string, updates: Partial<ScheduleWindow>) => {
    if (!schedule) {
      return;
    }

    await persistSchedule(buildUpdatedSchedule(schedule, windowId, updates), windowId);
  };

  const renderWindow = (window: ScheduleWindow, windowIndex: number) => {
    const disabled = !schedule || !schedule.enabled;
    const isSavingWindow = savingWindowIds.includes(window.id);
    const enabledDayCount = window.days.filter(Boolean).length;
    const startMinutes = SchedulingService.timeToMinutes(window.start);
    const endMinutes = SchedulingService.timeToMinutes(window.end);
    const startOptions = TIME_OPTIONS.filter((time) => SchedulingService.timeToMinutes(time) < endMinutes);
    const endOptions = TIME_OPTIONS.filter((time) => SchedulingService.timeToMinutes(time) > startMinutes);
    const warningMessages = SchedulingService.getWindowWarningMessages(schedule, window.id);

    return (
      <li key={window.id}>
        <Card
          padding
          className={clsx(styles.settingsGrid, styles.scheduleWindowCard, disabled && styles.disabled)}
        >
          <div className={styles.scheduleWindowHeader}>
            <div>
              <strong>Window {windowIndex + 1}</strong>
              <p className={styles.subtle}>Recurring weekly block</p>
            </div>
            {window.id !== '_initial' ? (
              <Button
                variant='ghost'
                disabled={disabled || isSavingWindow}
                onClick={() => {
                  removeWindow(window.id).catch(console.error);
                }}
              >
                Remove
              </Button>
            ) : null}
          </div>

          <div className={styles.scheduleGroup}>
            <span className={styles.settingsLabel}>Repeat on</span>
            <div className={styles.presetRow}>
              {QUICK_DAY_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant='secondary'
                  disabled={disabled || isSavingWindow}
                  onClick={() => {
                    updateWindow(window.id, { days: preset.days }).catch(console.error);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className={styles.dayGrid}>
              {SCHEDULE_DAY_LABELS.map((day, index) => {
                const isOnlyEnabledDay = enabledDayCount === 1 && window.days[index];

                return (
                  <label
                    key={`${window.id}-${day}`}
                    className={styles.dayChip}
                  >
                    <input
                      type='checkbox'
                      checked={Boolean(window.days[index])}
                      disabled={disabled || isSavingWindow || isOnlyEnabledDay}
                      onChange={(event) => {
                        const nextDays = [...window.days] as ScheduleDays;
                        nextDays[index] = event.target.checked;
                        updateWindow(window.id, { days: nextDays }).catch(console.error);
                      }}
                    />
                    {day}
                  </label>
                );
              })}
            </div>
            <p className={styles.subtle}>Each window always keeps at least one active day selected.</p>
          </div>

          <label className={styles.settingsLabel}>
            Start time
            <select
              className={styles.settingsInput}
              value={window.start}
              disabled={disabled || isSavingWindow}
              onChange={(event) => {
                updateWindow(window.id, { start: event.target.value }).catch(console.error);
              }}
            >
              {startOptions.map((time) => (
                <option
                  key={`${window.id}-start-${time}`}
                  value={time}
                >
                  {time}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.settingsLabel}>
            End time
            <select
              className={styles.settingsInput}
              value={window.end}
              disabled={disabled || isSavingWindow}
              onChange={(event) => {
                updateWindow(window.id, { end: event.target.value }).catch(console.error);
              }}
            >
              {endOptions.map((time) => (
                <option
                  key={`${window.id}-end-${time}`}
                  value={time}
                >
                  {time}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.scheduleAssistiveCopy}>
            <strong>Timezone</strong>
            <p className={styles.subtle}>Schedule windows use your browser&apos;s local timezone: {timezoneLabel}.</p>
            <p className={styles.subtle}>
              Times are in 15-minute increments, and end times are always after start times.
            </p>
            {isSavingWindow ? <p className={styles.subtle}>Saving changes…</p> : null}
            {warningMessages.length > 0 ? (
              <ul className={styles.inlineWarningList}>
                {warningMessages.map((message) => (
                  <li key={`${window.id}-${message}`}>{message}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </Card>
      </li>
    );
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
            handleScheduleEnabledChange(event.target.checked).catch(console.error);
          }}
          disabled={!schedule || isSavingToggle}
          checked={Boolean(schedule?.enabled)}
          reverse
          tight
        />
        <div className={styles.scheduleAssistiveCopy}>
          <p className={styles.subtle}>
            When this is off, blocking stays active all day. Turn it on to block only during the recurring windows
            below.
          </p>
          <p className={styles.subtle}>Current timezone: {timezoneLabel}</p>
        </div>
      </Card>

      {isLoading ? (
        <Card
          className={styles.emptyState}
          padding
        >
          Loading schedule windows…
        </Card>
      ) : null}

      {error ? (
        <Card
          className={styles.errorState}
          padding
        >
          <p>We couldn&apos;t load your scheduling settings.</p>
          <p className={styles.subtle}>{error}</p>
          <Button
            variant='secondary'
            onClick={() => {
              Promise.resolve(retryLoad()).catch(console.error);
            }}
          >
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !error && schedule ? (
        <>
          <div className={styles.scheduleHeadingRow}>
            <div>
              <h3>Schedule windows</h3>
              <p className={styles.subtle}>
                Add weekly rules, adjust days quickly, and review overlap warnings when you intentionally stack windows.
              </p>
            </div>
            <Button
              onClick={() => {
                addWindow().catch(console.error);
              }}
            >
              Add new schedule window
            </Button>
          </div>

          {saveError ? (
            <Card
              className={styles.errorState}
              padding
            >
              {saveError}
            </Card>
          ) : null}

          {warnings.length > 0 ? (
            <Card
              className={styles.warningState}
              padding
            >
              <strong>Heads up</strong>
              <ul className={styles.inlineWarningList}>
                {warnings.map((warning) => (
                  <li key={`${warning.code}-${warning.windowIds.join('-')}`}>{warning.message}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          {hasWindows ? (
            <ul className={styles.windowsList}>{schedule.windows.map(renderWindow)}</ul>
          ) : (
            <Card
              className={styles.emptyState}
              padding
            >
              <strong>No schedule windows yet.</strong>
              <p className={styles.subtle}>
                Create your first recurring block window to limit blocking to specific times.
              </p>
            </Card>
          )}
        </>
      ) : null}
    </OptionsTab>
  );
};

export default Scheduling;
