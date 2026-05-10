import clsx from 'clsx';
import { useMemo } from 'react';

import styles from './ThemeSelector.module.css';

import Card from '@/components/primitives/Card';
import Setting from '@/components/primitives/Setting';
import SettingsGrid from '@/components/shared/SettingsGrid';
import type { Theme } from '@/types/schema';

type ThemeSelectorProps = {
  theme: Theme;
  handleThemeChange: (theme: Theme) => void;
  previewHeight?: number;
};

const ThemeSelector = ({ theme, handleThemeChange, previewHeight }: ThemeSelectorProps) => {
  const [themeName, mode] = useMemo((): string[] => {
    return theme.split('-');
  }, [theme]);
  return (
    <SettingsGrid>
      <Setting
        settingId='theme'
        as='select'
        label='Theme'
        value={themeName}
        onChange={(event) => {
          handleThemeChange((event.target.value + '-' + mode) as Theme);
        }}
        options={[
          { value: 'focus', label: 'Abstract focus' },
          { value: 'mountains', label: 'Mountain calm' },
          { value: 'rainforest', label: 'Deep forest' },
        ]}
      />
      <Setting
        settingId='mode'
        as='select'
        label='Mode'
        value={mode}
        onChange={(event) => {
          handleThemeChange((themeName + '-' + event.target.value) as Theme);
        }}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />
      <div className={styles.themePreviewContainer}>
        <strong>Block page background</strong>
        <Card
          style={{ height: previewHeight ? `${previewHeight}px` : undefined }}
          className={clsx(styles.themePreview)}
        >
          <div className={clsx(styles.themeCover, styles.rainforest)} />
          <div className={clsx(styles.themeCover, styles.mountains)} />
          <div className={clsx(styles.themeCover, styles.focus)} />
        </Card>
      </div>
    </SettingsGrid>
  );
};

export default ThemeSelector;
