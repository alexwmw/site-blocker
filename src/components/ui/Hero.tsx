import EyebrowLabel from './EyebrowLabel';
import styles from './Hero.module.css';

const Hero = ({ label = 'Hold', title, subheading }: { label?: string; title: string; subheading: string }) => {
  return (
    <header className={styles.hero}>
      <EyebrowLabel>{label}</EyebrowLabel>
      <h1 className={styles.heroTitle}>{title}</h1>
      <p className={styles.subtle}>{subheading}</p>
    </header>
  );
};

export default Hero;
