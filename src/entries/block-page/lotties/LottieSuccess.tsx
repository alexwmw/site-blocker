import type { LottieRef } from 'lottie-react';

import animationSuccess from './animationSuccess.json';

import BasicLottie from '@/components/BasicLottie';

const LottieSuccess = ({ lottieRef }: { lottieRef: LottieRef }) => {
  return (
    <BasicLottie
      animationData={animationSuccess}
      lottieRef={lottieRef}
      autoplay={true}
    />
  );
};

export default LottieSuccess;
