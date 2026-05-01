import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import styles from './QuickOptions.module.css';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Setting from '@/components/primitives/Setting';
import Stack from '@/components/primitives/Stack';
import Switch from '@/components/primitives/Switch';
import useOptionChangeHandlers from '@/entries/options/useOptionChangeHandlers';
import type { Settings } from '@/types/schema';
import { SETTINGS_LIMITS } from '@/types/schema';

const QuickOptions = ({
  settings,
  updateSettings,
  className,
}: {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  className?: string;
}) => {
  const { handleExtendedUnblockDurationChange, handleExtendedUnblockEnabledChange } = useOptionChangeHandlers(
    settings,
    updateSettings,
  );
  const [open, setOpen] = useState<boolean>(false);

  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage().catch(console.error);
  };

  return (
    <Card
      className={clsx(styles.quickOptions, className)}
      padding
      as='aside'
      variant={open ? '' : 'subtle'}
    >
      <details onClick={() => setOpen(!open)}>
        <summary>
          <ChevronRight />
          Quick options
        </summary>
        {/*<Paragraph*/}
        {/*  size='small'*/}
        {/*  subtle*/}
        {/*>*/}
        {/*  Changes here will update your main preferences.*/}
        {/*</Paragraph>*/}
        <Stack
          topMargin
          gap='small'
        >
          <Switch
            switchSize='small'
            id='extended-unblock-enabled'
            label='Keep unblocked after hold'
            checked={settings?.extendedUnblock.enabled}
            onChange={(event) => {
              handleExtendedUnblockEnabledChange(event.target.checked);
            }}
          />
          <Setting
            settingId='extendedUnblock'
            label='Unblock duration (minutes)'
            type='number'
            variant='row'
            min={SETTINGS_LIMITS.extendedUnblockDurationMinMinutes}
            max={SETTINGS_LIMITS.extendedUnblockDurationMaxMinutes}
            value={settings?.extendedUnblock.durationMinutes}
            disabled={!settings?.extendedUnblock.enabled}
            onChange={(event) => {
              handleExtendedUnblockDurationChange(event.target.value);
            }}
          />
          <Button
            onClick={handleOpenOptions}
            variant='ghost'
          >
            Go to options
          </Button>
        </Stack>
      </details>
    </Card>
  );
};

export default QuickOptions;
