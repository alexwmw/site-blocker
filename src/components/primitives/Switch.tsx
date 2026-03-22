import clsx from 'clsx';
import type { InputHTMLAttributes } from 'react';

import styles from './Switch.module.css';

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  fieldHint?: string;
  id: string;
  reverse?: boolean;
  compact?: boolean;
};

const Switch = ({ label, fieldHint, className, reverse, id: switchId, ...rest }: SwitchProps) => {
  const describedById = switchId + '-field-hint';

  return (
    <div className={clsx(styles.switchGrid, reverse && styles.reverse, className)}>
      <label
        htmlFor={switchId}
        className={styles.switchLabel}
      >
        <span className={styles.labelText}>{label}</span>
        <span className={styles.controlWrap}>
          <input
            id={switchId}
            className={styles.input}
            type='checkbox'
            aria-describedby={describedById}
            {...rest}
          />
          <span
            className={styles.slider}
            aria-hidden='true'
          />
        </span>
      </label>
      {fieldHint ? (
        <span
          id={describedById}
          className={styles.fieldHint}
        >
          {fieldHint}
        </span>
      ) : null}
    </div>
  );
};

export default Switch;
