import type { LottieComponentProps } from 'lottie-react';
import Lottie from 'lottie-react';

const BasicLottie = (props: LottieComponentProps) => {
  return (
    <Lottie
      loop={false}
      autoplay={false}
      rendererSettings={{
        preserveAspectRatio: 'xMidYMid slice',
      }}
      {...props}
    />
  );
};

export default BasicLottie;
