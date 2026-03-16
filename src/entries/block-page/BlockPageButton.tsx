import type { LottieRef } from 'lottie-react';
import type { KeyboardEventHandler, MouseEventHandler } from 'react';

import LottieHold from './lotties/LottieHold';
import LottieSuccess from './lotties/LottieSuccess';

export type HoldButtonProps = {
  player: LottieRef;
  remainingTime: number | null;
  onMouseDown: MouseEventHandler;
  onKeyDown: KeyboardEventHandler;
  holdComplete: boolean;
};

const HoldButton = (props: HoldButtonProps) => {
  const { player, remainingTime, holdComplete, onKeyDown, onMouseDown } = props;
  const RelevantLottie = holdComplete ? LottieSuccess : LottieHold;

  return (
    <div>
      <RelevantLottie lottieRef={player} />
      <button
        onKeyDown={onKeyDown}
        onMouseDown={onMouseDown}
        className='hold-button'
        tabIndex={1}
      >
        {remainingTime ?? 'Hold'}
      </button>
    </div>
  );
};

export default HoldButton;
