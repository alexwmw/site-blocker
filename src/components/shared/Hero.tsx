import clsx from 'clsx';

import styles from './Hero.module.css';

import IconCompact from '@/assets/icons/icon-no-bg.svg?react';
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
  title?: string;
  subheading?: string;
  variant?: 'compact';
}) => {
  const Icon = variant === 'compact' ? IconCompact : IconTitle;
  const titleMode = !subheading && !title;
  return (
    <header className={clsx(styles.hero, variant && styles[variant], titleMode && styles.titleMode)}>
      <div className={styles.row}>
        <Icon
          height={54}
          className={styles.holdIcon}
          title='Hold'
        />
        <div>
          {variant === 'compact' ? <EyebrowLabel>{label}</EyebrowLabel> : null}
          {title ? <h1 className={styles.heroTitle}>{title}</h1> : null}
          {subheading ? <Paragraph subtle>{subheading}</Paragraph> : null}
          {titleMode ? <Paragraph subtle>Mindful Website Blocking</Paragraph> : null}
        </div>
      </div>
    </header>
  );
};

export default Hero;
