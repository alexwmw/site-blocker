import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './Paragraph.module.css';

const Paragraph = ({ children, subtle }: { children: ReactNode; subtle?: boolean }) => {
  return <p className={clsx(subtle && styles.subtle)}>{children}</p>;
};

export default Paragraph;
