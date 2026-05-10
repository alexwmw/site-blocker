import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './Paragraph.module.css';

type ParagraphProps = {
  children: ReactNode;
  size?: 'small' | 'medium';
  subtle?: boolean;
  strong?: boolean;
  centered?: boolean;
};

const Paragraph = ({ children, size = 'medium', ...rest }: ParagraphProps) => {
  const styleProps = Object.entries(rest)
    .filter(([_key, value]) => typeof value === 'boolean' && value)
    .map(([key]) => styles[key]);

  return <p className={clsx(styles.paragraph, styleProps, styles[size])}>{children}</p>;
};

export default Paragraph;
