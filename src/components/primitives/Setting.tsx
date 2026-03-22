import clsx from 'clsx';
import type { ComponentProps } from 'react';

import styles from './Setting.module.css';

type Option = { value: string; label: string };

type BaseProps = {
  className?: string;
  label: string;
  fieldHint?: string;
  settingId: string;
};

type SelectProps = BaseProps & {
  as: 'select';
  options: Option[];
} & Omit<ComponentProps<'select'>, 'className'>;

type InputProps = BaseProps & {
  as?: 'input';
  options?: never;
} & Omit<ComponentProps<'input'>, 'className'>;

type SettingProps = SelectProps | InputProps;

const Select = ({
  options,
  settingId,
  ...props
}: Omit<ComponentProps<'select'>, 'className'> & { options: Option[]; settingId: string }) => {
  return (
    <select
      id={settingId}
      className={styles.settingsInput}
      {...props}
    >
      {options.map(({ value, label }) => (
        <option
          key={value}
          value={value}
        >
          {label}
        </option>
      ))}
    </select>
  );
};

const Setting = (props: SettingProps) => {
  const { settingId, className, label, fieldHint, options, as, ...inputProps } = props;
  const describedById = settingId + '-field-hint';
  return (
    <div>
      <label
        htmlFor={settingId}
        className={clsx(styles.settingsLabel, className)}
      >
        {label}

        {as === 'select' ? (
          <Select
            aria-describedby={describedById}
            {...props}
          />
        ) : (
          <input
            id={settingId}
            aria-describedby={describedById}
            className={styles.settingsInput}
            {...(inputProps as ComponentProps<'input'>)}
          />
        )}
      </label>
      {fieldHint ? (
        <span
          id={describedById}
          className={styles.settingsFieldHint}
        >
          {fieldHint}
        </span>
      ) : null}
    </div>
  );
};

export default Setting;
