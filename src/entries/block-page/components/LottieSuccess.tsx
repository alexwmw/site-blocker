import type { LottieRef } from 'lottie-react';

import animationSuccess from '../../../assets/lotties/animationSuccess.json';

import BasicLottie from '@/components/primitives/BasicLottie';

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
