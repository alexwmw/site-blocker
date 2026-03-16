import type { LottieRef } from 'lottie-react';

import BasicLottie from '../../../components/BasicLottie';

import animationSuccess from './animationSuccess.json';

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
