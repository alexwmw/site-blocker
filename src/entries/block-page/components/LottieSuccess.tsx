import type { LottieRef } from 'lottie-react';

import styles from './LottieSuccess.module.css';

import animationSuccess from '@/assets/lotties/animationSuccess.json';
import BasicLottie from '@/components/primitives/BasicLottie';

const LottieSuccess = ({ lottieRef }: { lottieRef: LottieRef }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.backgroundSuccess} />
      <div className={styles.background} />
      <BasicLottie
        animationData={animationSuccess}
        lottieRef={lottieRef}
        autoplay={true}
      />
    </div>
  );
};

export default LottieSuccess;
