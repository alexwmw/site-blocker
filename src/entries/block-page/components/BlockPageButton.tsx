import clsx from 'clsx';
import type { KeyboardEventHandler, MouseEventHandler } from 'react';

import styles from './BlockPageButton.module.css';
import ButtonOutline from './buttonOutline.svg?react';

import Title from '@/assets/icons/icon-white-on-bg.svg?react';

export type HoldButtonProps = {
  remainingTime: number | null;
  onMouseDown: MouseEventHandler;
  onKeyDown: KeyboardEventHandler;
  autoFocus: boolean;
  holdIsComplete: boolean;
  animationDuration: number;
  held: boolean;
};

const HoldButton = (props: HoldButtonProps) => {
  const { autoFocus, animationDuration, held, holdIsComplete, remainingTime, onKeyDown, onMouseDown } = props;
  const buttonText =
    remainingTime === null ? <Title title='Hold' /> : <span>{remainingTime === 0 ? 'OK' : remainingTime}</span>;

  return (
    <div className={styles.holdAction}>
      <div className={styles.buttonStack}>
        <ButtonOutline
          className={clsx(styles.buttonEdge, held && styles.held)}
          style={{ animationDuration: animationDuration + 's' }}
        />
        <button
          autoFocus={autoFocus}
          onKeyDown={onKeyDown}
          onMouseDown={onMouseDown}
          className={clsx(styles.holdButton, held && styles.held, holdIsComplete && styles.holdComplete)}
          aria-live='polite'
          disabled={holdIsComplete}
          style={{ animationDuration: animationDuration + 's' }}
        >
          {buttonText}
        </button>
      </div>
      <p className={styles.holdCaption}>{holdIsComplete ? 'Success! Redirecting…' : 'Click and hold.'}</p>
    </div>
  );
};

export default HoldButton;
