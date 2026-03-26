import type { LottieComponentProps } from 'lottie-react';
import Lottie from 'lottie-react';

const BasicLottie = (props: LottieComponentProps) => {
  return (
    <Lottie
      style={{ width: '100%', height: '100%' }}
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
