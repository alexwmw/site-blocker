import clsx from 'clsx';

import EyebrowLabel from './EyebrowLabel';
import styles from './Hero.module.css';

import Paragraph from '@/components/primitives/Paragraph';

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
      <div className={styles.brandRow}>
        <div
          aria-hidden='true'
          className={styles.brandGlyph}
        >
          H
        </div>
        <div>
          <p className={styles.brandName}>Hold</p>
          <p className={styles.brandTone}>Mindful site boundaries</p>
        </div>
      </div>
      <EyebrowLabel>{label}</EyebrowLabel>
      <h1 className={styles.heroTitle}>{title}</h1>
      {subheading ? <Paragraph subtle>{subheading}</Paragraph> : null}
    </header>
  );
};

export default Hero;
