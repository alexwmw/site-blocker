import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type CardProps<T extends ElementType = 'div'> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

const Card = <T extends ElementType = 'div'>({ as, children, className, ...rest }: CardProps<T>) => {
  const Component = as ?? 'div';

  return (
    <Component
      className={['ui-card', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default Card;
