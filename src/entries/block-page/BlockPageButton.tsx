import type { LottieRef } from 'lottie-react';
import type { KeyboardEventHandler, MouseEventHandler } from 'react';

import LottieHold from './lotties/LottieHold';
import LottieSuccess from './lotties/LottieSuccess';

export type HoldButtonProps = {
  player: LottieRef;
  remainingTime: number | null;
  onMouseDown: MouseEventHandler;
  onKeyDown: KeyboardEventHandler;
};

const HoldButton = (props: HoldButtonProps) => {
  const { player, remainingTime, onKeyDown, onMouseDown } = props;
  const RelevantLottie = remainingTime === 0 ? LottieSuccess : LottieHold;
  const buttonText = String(remainingTime === null ? 'Hold' : remainingTime);

  return (
    <div>
      <RelevantLottie lottieRef={player} />
      <button
        onKeyDown={onKeyDown}
        onMouseDown={onMouseDown}
        className='hold-button'
      >
        {buttonText}
      </button>
    </div>
  );
};

export default HoldButton;
