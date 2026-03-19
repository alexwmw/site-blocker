import type { ReactNode } from 'react';

import styles from './RenderBoundary.module.css';

type RenderBoundaryProps = {
  data: unknown;
  error: Error | null;
  children: ReactNode;
};

const RenderBoundary = ({ data, error, children }: RenderBoundaryProps) => {
  if (error) {
    return (
      <p
        className={styles.error}
        role='alert'
      >
        {error.message || 'Something went wrong.'}
      </p>
    );
  }

  if (data === null || data === undefined) {
    return (
      <div
        className={styles.loading}
        aria-hidden='true'
      >
        <span className={styles.spinner} />
      </div>
    );
  }

  return <>{children}</>;
};

export default RenderBoundary;
