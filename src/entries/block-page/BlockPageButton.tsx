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
  const holdIsComplete = remainingTime === 0;
  const RelevantLottie = holdIsComplete ? LottieSuccess : LottieHold;
  const buttonText = String(remainingTime === null ? 'Hold to unblock' : remainingTime);

  return (
    <div className='hold-action'>
      <RelevantLottie lottieRef={player} />
      <button
        onKeyDown={onKeyDown}
        onMouseDown={onMouseDown}
        className='hold-button'
        aria-live='polite'
      >
        {buttonText}
      </button>
      <p className='hold-caption'>{holdIsComplete ? 'Success! Redirecting…' : 'Click and hold or press Space.'}</p>
    </div>
  );
};

export default HoldButton;
