import type { LottieComponentProps } from 'lottie-react';
import Lottie from 'lottie-react';

const BasicLottie = (props: LottieComponentProps) => {
  return (
    <Lottie
      style={{ display: 'none' }} // todo: remove once styles are added
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
