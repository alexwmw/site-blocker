import type { LottieRef } from 'lottie-react';

import animationHold from './animationHold.json';

import BasicLottie from '@/components/BasicLottie';

const LottieHold = ({ lottieRef }: { lottieRef: LottieRef }) => {
  return (
    <BasicLottie
      animationData={animationHold}
      lottieRef={lottieRef}
    />
  );
};

export default LottieHold;
