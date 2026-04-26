import clsx from 'clsx';

import styles from './Hero.module.css';

import IconCompact from '@/assets/icons/icon512.svg?react';
import IconTitle from '@/assets/icons/title-brand-colors.svg?react';
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
  variant?: 'compact';
}) => {
  const Icon = variant === 'compact' ? IconCompact : IconTitle;
  return (
    <header className={clsx(styles.hero, variant && styles[variant])}>
      <div className={styles.row}>
        <Icon
          height={54}
          className={styles.holdIcon}
          title='Hold icon'
        />
        <div>
          {variant === 'compact' ? <EyebrowLabel>{label}</EyebrowLabel> : null}
          <h1 className={styles.heroTitle}>{title}</h1>
          {subheading ? <Paragraph subtle>{subheading}</Paragraph> : null}
        </div>
      </div>
    </header>
  );
};

export default Hero;
