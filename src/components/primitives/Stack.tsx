import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import styles from './Stack.module.css';

type StackProps<T extends ElementType = 'div'> = {
  as?: T;
  asList?: boolean;
  children: ReactNode;
  className?: string;
  topMargin?: boolean;
  gap?: 'x-small' | 'small' | 'medium' | 'large';
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

const Stack = <T extends ElementType = 'div'>({
  children,
  as,
  asList,
  topMargin,
  className,
  gap = 'medium',
  ...props
}: StackProps<T>) => {
  const Component = asList ? 'ul' : (as ?? 'div');
  return (
    <Component
      className={clsx(styles.stack, styles[`${gap}-gap`], topMargin && styles.topMargin, className)}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Stack;
