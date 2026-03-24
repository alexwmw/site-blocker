import OptionsTab from '../OptionsTab';

import styles from './Scheduling.module.css';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Paragraph from '@/components/primitives/Paragraph';
import Stack from '@/components/primitives/Stack';
import Switch from '@/components/primitives/Switch';
import InfoItem from '@/components/shared/InfoItem';
import SettingsGrid from '@/components/shared/SettingsGrid';
import SchedulingWindow from '@/entries/options/tabs/Scheduling/SchedulingWindow';
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
  if (!schedule) {
    return (
      <OptionsTab
        title='Scheduling'
        className={className}
      />
    );
  }

  return (
    <OptionsTab
      title='Scheduling'
      className={className}
    >
      <Card padding>
        <SettingsGrid>
          <Switch
            id='scheduling_enabled'
            label='Enable scheduled blocking'
            onChange={(event) => {
              setSchedulingEnabled(event.target.checked).catch(console.error);
            }}
            checked={schedule.enabled}
            fieldHint='When this is off, blocking stays active all day. Turn it on to block only during the recurring windows below.'
          />
        </SettingsGrid>
      </Card>
      <div className={styles.scheduleHeadingRow}>
        <div>
          <h3>Schedule windows</h3>
          <Paragraph subtle>Add weekly rules, adjust days and times, and set multiple schedules.</Paragraph>
        </div>
        <Button
          disabled={!schedule.enabled}
          onClick={() => {
            addScheduleWindow().catch(console.error);
          }}
        >
          Add new schedule window
        </Button>
      </div>
      <Stack
        gap='small'
        topMargin
        asList
      >
        {!schedule.enabled && (
          <InfoItem
            tone='good'
            text='Scheduled blocking is disabled. Enable scheduled blocking to set a schedule.'
          />
        )}
        {schedule.windows.map((win, index) => (
          <li key={win.id}>
            <SchedulingWindow
              window={win}
              disabled={!schedule.enabled}
              windowIndex={index}
              removeWindow={() => removeScheduleWindow(win.id)}
              updateWindow={(update: Partial<ScheduleWindow>) => updateScheduleWindow(win.id, update)}
            />
          </li>
        ))}
      </Stack>
    </OptionsTab>
  );
};

export default Scheduling;
