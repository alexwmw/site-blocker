import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './Paragraph.module.css';

const Paragraph = ({
  children,
  subtle,
  size = 'medium',
}: {
  children: ReactNode;
  subtle?: boolean;
  size?: 'small' | 'medium';
}) => {
  return <p className={clsx(subtle && styles.subtle, styles[size])}>{children}</p>;
};

export default Paragraph;
