import clsx from 'clsx';

import styles from './BrandMark.module.css';

type BrandMarkProps = {
  className?: string;
  compact?: boolean;
};

const BrandMark = ({ className, compact = false }: BrandMarkProps) => {
  return (
    <div className={clsx(styles.lockup, compact && styles.compact, className)}>
      <div className={styles.mark} aria-hidden='true'>
        <span className={styles.markLetter}>H</span>
      </div>
      <div className={styles.copy}>
        <span className={styles.name}>Hold</span>
        <span className={styles.tagline}>Friction for better focus</span>
      </div>
    </div>
  );
};

export default BrandMark;
