import Card from '../../../components/ui/Card';
import useSettings from '../../../hooks/useSettings';
import type { Theme } from '../../../types/schema';
import styles from '../OptionsApp.module.css';
import OptionsTab from '../OptionsTab';

const Preferences = ({ className }: { className?: string }) => {
  const { settings, updateSettings, isLoading: isSettingsLoading } = useSettings();

  const handleThemeChange = (theme: Theme) => {
    updateSettings({ theme }).catch(console.error);
  };

  const handleHoldDurationChange = (value: number) => {
    const clamped = Math.max(3, Math.min(99, value));
    updateSettings({ holdDurationSeconds: clamped }).catch(console.error);
  };

  return (
    <OptionsTab
      title='Preference'
      isContentLoaded={isSettingsLoading}
      className={className}
    >
      <Card className={styles.settingsGrid}>
        <label className={styles.settingsLabel}>
          Theme
          <select
            className={styles.settingsInput}
            value={settings?.theme ?? 'mindful-light'}
            onChange={(event) => {
              handleThemeChange(event.target.value as Theme);
            }}
            disabled={!settings}
          >
            <option value='mindful-light'>Mindful light</option>
            <option value='mindful-dark'>Mindful dark</option>
            <option value='focus-light'>Focus light</option>
            <option value='focus-dark'>Focus dark</option>
          </select>
        </label>

        <label className={styles.settingsLabel}>
          Hold to unblock (seconds)
          <input
            className={styles.settingsInput}
            type='number'
            min={3}
            max={99}
            value={settings?.holdDurationSeconds ?? 3}
            disabled={!settings}
            onChange={(event) => {
              handleHoldDurationChange(Number(event.target.value));
            }}
          />
        </label>
      </Card>
    </OptionsTab>
  );
};

export default Preferences;
