import type { ReactNode } from 'react';

import styles from './EyebrowLabel.module.css';

type EyebrowLabelProps = {
  children: ReactNode;
};

const EyebrowLabel = ({ children }: EyebrowLabelProps) => {
  return <p className={styles.eyebrow}>{children}</p>;
};

export default EyebrowLabel;
