import type { ReactNode } from 'react';

import styles from './SettingsGrid.module.css';

const SettingsGrid = ({ children }: { children: ReactNode }) => {
  return <div className={styles.settingsGrid}>{children}</div>;
};

export default SettingsGrid;
