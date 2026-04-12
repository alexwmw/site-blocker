import type { LottieRef } from 'lottie-react';

import styles from './LottieHold.module.css';

import animationHold from '@/assets/lotties/animationHold.json';
import BasicLottie from '@/components/primitives/BasicLottie';

const LottieHold = ({ lottieRef }: { lottieRef: LottieRef }) => {
  return (
    <div className={styles.wrapper}>
      <BasicLottie
        animationData={animationHold}
        lottieRef={lottieRef}
      />
    </div>
  );
};

export default LottieHold;
