import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  selected?: boolean;
};

const Button = ({ variant = 'primary', selected, className, type = 'button', ...rest }: ButtonProps) => {
  return (
    <button
      className={clsx(styles.button, styles[variant], selected && styles.selected, className)}
      type={type}
      {...rest}
    />
  );
};

export default Button;
