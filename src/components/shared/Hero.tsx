import EyebrowLabel from './EyebrowLabel';
import styles from './Hero.module.css';

import Paragraph from '@/components/primitives/Paragraph';

const Hero = ({ label = 'Hold', title, subheading }: { label?: string; title: string; subheading: string }) => {
  return (
    <header className={styles.hero}>
      <EyebrowLabel>{label}</EyebrowLabel>
      <h1 className={styles.heroTitle}>{title}</h1>
      <Paragraph subtle>{subheading}</Paragraph>
    </header>
  );
};

export default Hero;
