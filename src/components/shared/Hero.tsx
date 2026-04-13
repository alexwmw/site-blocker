import clsx from 'clsx';

import styles from './Hero.module.css';

import Icon from '@/assets/icons/icon512.svg?react';
import Paragraph from '@/components/primitives/Paragraph';
import EyebrowLabel from '@/components/shared/EyebrowLabel';

const Hero = ({
  label = 'Hold',
  title,
  subheading,
  variant,
}: {
  label?: string;
  title: string;
  subheading?: string;
  variant?: string;
}) => {
  return (
    <header className={clsx(styles.hero, variant && styles[variant])}>
      <div className={styles.row}>
        <Icon
          height={54}
          className={styles.holdIcon}
        />
        <div>
          <EyebrowLabel>{label}</EyebrowLabel>
          <h1 className={styles.heroTitle}>{title}</h1>
          {subheading ? <Paragraph subtle>{subheading}</Paragraph> : null}
        </div>
      </div>
    </header>
  );
};

export default Hero;
