import clsx from 'clsx';
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Ref } from 'react';
import { useMemo, useState } from 'react';

import styles from './StarterModal.module.css';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Stack from '@/components/primitives/Stack';
import EyebrowLabel from '@/components/shared/EyebrowLabel';
import useStarterModalTabs from '@/entries/options/onboarding/useStarterModalTabs';

const StarterModal = ({ close, dialogRef }: { dialogRef: Ref<HTMLDialogElement>; close: () => void }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const ModalTabs = useStarterModalTabs();
  const nTabs = ModalTabs.length;
  const lastTabIndex = nTabs - 1;

  const dots = useMemo(
    () =>
      Array.from({ length: nTabs }).map((_, i) => (
        <div
          key={i}
          className={clsx(i === tabIndex && styles.selected, i > tabIndex && styles.hollow)}
        />
      )),
    [tabIndex, nTabs],
  );

  const handleNext = () => {
    setTabIndex((i) => {
      if (i === lastTabIndex) {
        close();
        return i;
      }
      return Math.min(i + 1, lastTabIndex);
    });
  };

  const handlePrev = () => {
    setTabIndex((i) => Math.max(i - 1, 0));
  };

  return (
    <dialog
      className={styles.modal}
      ref={dialogRef}
    >
      <Card
        className={styles.modalInner}
        padding
      >
        <div className={styles.titleRow}>
          <EyebrowLabel accentColor>
            Step {tabIndex + 1} of {nTabs}
          </EyebrowLabel>

          <Button
            variant={'ghost'}
            onClick={close}
          >
            <X />
          </Button>
        </div>
        <Stack
          as='section'
          className={styles.mainContent}
          gap='small'
        >
          {ModalTabs[tabIndex]}
        </Stack>

        <div className={styles.prevNextButtonRow}>
          <Button
            variant={'secondary'}
            onClick={handlePrev}
            title='Previous'
            disabled={tabIndex === 0}
          >
            <ChevronLeft />
            Back
          </Button>
          <div className={styles.indicators}>{dots}</div>
          <Button
            variant={'primary'}
            onClick={handleNext}
            autoFocus
          >
            {tabIndex === lastTabIndex ? (
              <>
                Finish <Check />
              </>
            ) : (
              <>
                Next <ChevronRight />
              </>
            )}
          </Button>
        </div>
      </Card>
    </dialog>
  );
};

export default StarterModal;
