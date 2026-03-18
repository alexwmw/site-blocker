import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import styles from './Card.module.css';

type CardProps<T extends ElementType = 'div'> = {
  as?: T;
  children: ReactNode;
  className?: string;
  padding?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

const Card = <T extends ElementType = 'div'>({ as, children, padding, className, ...rest }: CardProps<T>) => {
  const Component = as ?? 'div';

  return (
    <Component
      className={clsx(styles.card, padding && styles.padding, className)}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default Card;
