import clsx from 'clsx';

import styles from './Completion.module.css';

const Completion = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox='0 0 200 200'
      xmlns='http://www.w3.org/2000/svg'
      className={clsx(className, styles.completion)}
    >
      <path
        className={styles.comet}
        d='M90 0 H110 A90 90 0 0 1 200 90 V110 A90 90 0 0 1 110 200 H90 A90 90 0 0 1 0 110 V90 A90 90 0 0 1 90 0 Z'
        stroke='var(--color-brand-contrast)'
        strokeWidth={11}
        fill='none'
        pathLength='1'
      />
      <path
        className={styles.settle}
        d='M90 0 H110 A90 90 0 0 1 200 90 V110 A90 90 0 0 1 110 200 H90 A90 90 0 0 1 0 110 V90 A90 90 0 0 1 90 0 Z'
        stroke='var(--color-brand-contrast)'
        strokeWidth={11}
        fill='none'
        pathLength='1'
      />
      <path
        className={styles.check}
        d='M62 100 L86 124 L138 74'
        stroke='var(--color-text-inverse)'
        strokeWidth={11}
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
        pathLength='1'
      />
    </svg>
  );
};
export default Completion;
