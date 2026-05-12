import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';

import styles from './UpdatedBanner.module.css';

import HoldIcon from '@/assets/icons/icon-no-bg.svg?react';
import LegacyIcon from '@/assets/icons/legacy-icon.svg?react';
import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Stack from '@/components/primitives/Stack';
import Hold from '@/components/shared/Hold';

type ReviewCardProps = {
  onSelectDontShow: () => void;
};

const UpdatedBanner = ({ onSelectDontShow }: ReviewCardProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const { version } = chrome.runtime.getManifest();

  const handleMoreInfoOpen = () => {
    ref.current?.show();
  };

  const handleMoreInfoClose = () => {
    ref.current?.close();
  };
  return (
    <Card
      className={styles.updatedBanner}
      as='aside'
      padding
      variant='subtle'
    >
      <Stack gap='medium'>
        <div className={styles.iconRow}>
          <LegacyIcon />
          <ArrowRight />
          <HoldIcon />
        </div>
        <h2>Updated to Hold v{version}</h2>
        <dialog ref={ref}>
          <Card padding>
            <div>
              <h3>Time Out has been rebranded: Welcome to Hold</h3>
              <p>Same core experience, with a fresh new look and identity.</p>
              <p>Your settings and blocked sites remain unchanged.</p>
              <p>
                Thank you for choosing <Hold />.
              </p>
            </div>
            <Button onClick={handleMoreInfoClose}>Close</Button>
          </Card>
        </dialog>
        <Button
          onClick={handleMoreInfoOpen}
          variant='secondary'
        >
          More info
        </Button>
        <Button
          onClick={onSelectDontShow}
          variant='ghost'
        >
          Don't show again
        </Button>
      </Stack>
    </Card>
  );
};

export default UpdatedBanner;
