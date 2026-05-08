import type { Ref } from 'react';

import styles from './StarterModal.module.css';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Stack from '@/components/primitives/Stack';
import PopularWebsitesSelector from '@/components/shared/PopularWebsitesSelector';
import type { BlockRule } from '@/types/schema';

const StarterModal = ({
  close,
  dialogRef,
  blockRules,
  addRule,
}: {
  dialogRef: Ref<HTMLDialogElement>;
  close: () => void;
  blockRules: BlockRule[];
  addRule: (rule: BlockRule) => Promise<unknown>;
}) => {
  return (
    <dialog
      className={styles.modal}
      ref={dialogRef}
    >
      <Card
        className={styles.modalInner}
        padding
      >
        <Stack>
          <div className={styles.titleRow}>
            <h2>Get started</h2>
            <div>
              <Button
                variant={'secondary'}
                onClick={close}
              >
                Close
              </Button>
            </div>
          </div>
          <PopularWebsitesSelector
            blockRules={blockRules}
            addRule={addRule}
          />
        </Stack>
      </Card>
    </dialog>
  );
};

export default StarterModal;
