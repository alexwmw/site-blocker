import type { LottieRef } from 'lottie-react';

import animationHold from '../../../assets/lotties/animationHold.json';

import BasicLottie from '@/components/primitives/BasicLottie';

const LottieHold = ({ lottieRef }: { lottieRef: LottieRef }) => {
  return (
    <BasicLottie
      animationData={animationHold}
      lottieRef={lottieRef}
    />
  );
};

export default LottieHold;
