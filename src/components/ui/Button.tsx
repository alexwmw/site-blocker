import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const Button = ({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) => {
  return (
    <button
      className={clsx(styles.button, styles[variant], className)}
      type={type}
      {...rest}
    />
  );
};

export default Button;
