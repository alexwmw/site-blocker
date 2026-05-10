import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './EyebrowLabel.module.css';

type EyebrowLabelProps = {
  children: ReactNode;
  accentColor?: boolean;
};

const EyebrowLabel = ({ children, accentColor }: EyebrowLabelProps) => {
  return <p className={clsx(styles.eyebrow, accentColor && styles.accentColor)}>{children}</p>;
};

export default EyebrowLabel;
