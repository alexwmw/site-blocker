import clsx from 'clsx';
import { Clock, Info } from 'lucide-react';

import styles from './InfoItem.module.css';

export type InfoTone = 'good' | 'bad' | 'neutral';

const Icons = { Clock, Info };

export type IconName = keyof typeof Icons;

type InfoItemProps = {
  text: string;
  tone?: InfoTone;
  iconName?: IconName;
  noIcon?: boolean;
  ctaText?: string;
  ctaAction?: () => void;
};

const InfoItem = ({ text, tone = 'neutral', iconName = 'Info', noIcon, ctaText, ctaAction }: InfoItemProps) => {
  const Icon = Icons[iconName];

  return (
    <div className={clsx(styles.infoItem, styles[`info${tone[0].toUpperCase()}${tone.slice(1)}`])}>
      {!noIcon ? <Icon className={styles.infoIcon} /> : null}

      <span className={styles.infoText}>
        {text}{' '}
        <a
          href=''
          onClick={ctaAction}
          className={styles.infoText}
        >
          {ctaText}
        </a>
      </span>
    </div>
  );
};
export default InfoItem;
