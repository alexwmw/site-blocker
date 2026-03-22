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
      <EyebrowLabel>{label}</EyebrowLabel>
      <h1 className={styles.heroTitle}>{title}</h1>
      {subheading ? <Paragraph subtle>{subheading}</Paragraph> : null}
    </header>
  );
};

export default Hero;
