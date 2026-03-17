import clsx from 'clsx';
import type { InputHTMLAttributes } from 'react';

import styles from './Switch.module.css';

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  description?: string;
  id: string;
};

const Switch = ({ label, description, className, id: switchId, ...rest }: SwitchProps) => {
  return (
    <label
      htmlFor={switchId}
      className={clsx(styles.switchLabel, className)}
    >
      <span className={styles.textGroup}>
        <span>{label}</span>
        {description ? <span className={styles.description}>{description}</span> : null}
      </span>
      <span className={styles.controlWrap}>
        <input
          id={switchId}
          className={styles.input}
          type='checkbox'
          {...rest}
        />
        <span
          className={styles.slider}
          aria-hidden='true'
        />
      </span>
    </label>
  );
};

export default Switch;
