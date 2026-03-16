import type { LottieRef } from 'lottie-react';

import BasicLottie from '../../../components/BasicLottie';

import animationHold from './animationHold.json';

const LottieHold = ({ lottieRef }: { lottieRef: LottieRef }) => {
  return (
    <BasicLottie
      animationData={animationHold}
      lottieRef={lottieRef}
    />
  );
};

export default LottieHold;
