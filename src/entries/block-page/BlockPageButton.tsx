import type { LottieRef } from 'lottie-react';
import type { KeyboardEventHandler, MouseEventHandler } from 'react';

import LottieHold from './lotties/LottieHold';
import LottieSuccess from './lotties/LottieSuccess';

export type HoldButtonProps = {
  player: LottieRef;
  remainingTime: number | null;
  onMouseDown: MouseEventHandler;
  onKeyDown: KeyboardEventHandler;
  autoFocus: boolean;
};

const HoldButton = (props: HoldButtonProps) => {
  const { autoFocus, player, remainingTime, onKeyDown, onMouseDown } = props;
  const holdIsComplete = remainingTime === 0;
  const RelevantLottie = holdIsComplete ? LottieSuccess : LottieHold;
  const buttonText = String(remainingTime === null ? 'Hold' : remainingTime);

  return (
    <div className='hold-action'>
      <RelevantLottie lottieRef={player} />
      <button
        autoFocus={autoFocus}
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
