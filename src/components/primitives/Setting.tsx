import clsx from 'clsx';
import type { ComponentProps } from 'react';

import styles from './Setting.module.css';

type Option = { value: string; label: string };

type BaseProps = {
  className?: string;
  label: string;
  fieldHint?: string;
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

const Select = ({ options, ...props }: Omit<ComponentProps<'select'>, 'className'> & { options: Option[] }) => {
  return (
    <select
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
  const { className, label, fieldHint } = props;

  return (
    <label className={clsx(styles.settingsLabel, className)}>
      {label}

      {props.as === 'select' ? (
        <Select {...props} />
      ) : (() => {
          const { as: _as, options: _options, className: _className, label: _label, fieldHint: _fieldHint, ...inputProps } = props;

          return (
            <input
              className={styles.settingsInput}
              {...inputProps}
            />
          );
        })()}

      {fieldHint ? <span className={styles.settingsFieldHint}>{fieldHint}</span> : null}
    </label>
  );
};

export default Setting;
