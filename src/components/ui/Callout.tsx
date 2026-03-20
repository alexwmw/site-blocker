import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './Callout.module.css';

type CalloutTone = 'info' | 'success' | 'warning';

type CalloutProps = {
  title: ReactNode;
  children: ReactNode;
  tone?: CalloutTone;
  className?: string;
  action?: ReactNode;
};

const Callout = ({ title, children, tone = 'info', className, action }: CalloutProps) => {
  return (
    <div className={clsx(styles.callout, styles[tone], className)}>
      <div className={styles.body}>
        <strong className={styles.title}>{title}</strong>
        <div className={styles.content}>{children}</div>
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
};

export default Callout;
