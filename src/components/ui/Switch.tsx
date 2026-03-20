import clsx from 'clsx';
import type { InputHTMLAttributes } from 'react';

import styles from './Switch.module.css';

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  description?: string;
  descriptionClassName?: string;
  id: string;
  reverse?: boolean;
  compact?: boolean;
};

const Switch = ({
  label,
  description,
  descriptionClassName,
  className,
  reverse,
  compact,
  id: switchId,
  ...rest
}: SwitchProps) => {
  return (
    <label
      htmlFor={switchId}
      className={clsx(styles.switchLabel, reverse && styles.reverse, compact && styles.compact, className)}
    >
      <span className={styles.textGroup}>
        <span>{label}</span>
        {description ? <span className={descriptionClassName ?? styles.description}>{description}</span> : null}
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
