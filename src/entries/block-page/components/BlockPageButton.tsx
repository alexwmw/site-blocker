import clsx from 'clsx';
import type { LottieRef } from 'lottie-react';
import type { KeyboardEventHandler, MouseEventHandler } from 'react';

import styles from './BlockPageButton.module.css';
import LottieHold from './LottieHold';
import LottieSuccess from './LottieSuccess';

import Title from '@/assets/icons/icon512.svg?react';

export type HoldButtonProps = {
  player: LottieRef;
  remainingTime: number | null;
  onMouseDown: MouseEventHandler;
  onKeyDown: KeyboardEventHandler;
  autoFocus: boolean;
  holdIsComplete: boolean;
};

const HoldButton = (props: HoldButtonProps) => {
  const { autoFocus, holdIsComplete, player, remainingTime, onKeyDown, onMouseDown } = props;
  const RelevantLottie = holdIsComplete ? LottieSuccess : LottieHold;
  const buttonText = remainingTime === null ? <Title title='Hold' /> : remainingTime;

  return (
    <div className={styles.holdAction}>
      <div className={styles.buttonStack}>
        <RelevantLottie lottieRef={player} />
        <button
          autoFocus={autoFocus}
          onKeyDown={onKeyDown}
          onMouseDown={onMouseDown}
          className={clsx(styles.holdButton, holdIsComplete && styles.holdComplete)}
          aria-live='polite'
          disabled={holdIsComplete}
        >
          {buttonText}
        </button>
      </div>
      <p className={styles.holdCaption}>
        {holdIsComplete ? 'Success! Redirecting…' : 'Click and hold or press Space.'}
      </p>
    </div>
  );
};

export default HoldButton;
