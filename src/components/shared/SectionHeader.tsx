import type { ReactNode } from 'react';

import styles from './SectionHeader.module.css';

type SectionHeaderProps = {
  title: ReactNode;
  status?: ReactNode;
};

const SectionHeader = ({ title, status }: SectionHeaderProps) => {
  return (
    <div className={styles.sectionHeader}>
      <h2>{title}</h2>
      {status}
    </div>
  );
};

export default SectionHeader;
