import clsx from 'clsx';
import { Globe } from 'lucide-react';
import { useMemo, useState } from 'react';

import styles from './SiteIdentity.module.css';

import type { SiteIdentityModel } from '@/services/SiteIdentityService';

type SiteIdentityProps = {
  className?: string;
  identity: SiteIdentityModel;
  size?: 'small' | 'medium';
};

const SiteIdentity = ({ className, identity, size = 'medium' }: SiteIdentityProps) => {
  const [iconIndex, setIconIndex] = useState(0);

  const labelId = useMemo(() => {
    return identity.path ? `${identity.host ?? 'unknown'}${identity.path}` : (identity.host ?? identity.label);
  }, [identity.host, identity.label, identity.path]);

  const faviconSrc = identity.faviconSources[iconIndex] ?? null;
  const showFallback = !faviconSrc;

  return (
    <div
      className={clsx(styles.root, styles[size], className)}
      aria-label={labelId}
    >
      <div className={styles.iconShell}>
        {showFallback ? (
          <span
            className={styles.fallbackIcon}
            aria-hidden='true'
          >
            <Globe />
          </span>
        ) : (
          <img
            className={styles.icon}
            src={faviconSrc}
            alt=''
            aria-hidden='true'
            onError={() => {
              setIconIndex((currentIndex) => currentIndex + 1);
            }}
          />
        )}
      </div>
      <div className={styles.text}>
        <span className={styles.host}>{identity.host ?? identity.label}</span>
        {identity.path ? <span className={styles.path}>{identity.path}</span> : null}
      </div>
    </div>
  );
};

export default SiteIdentity;
