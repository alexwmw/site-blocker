import { ArrowRight } from 'lucide-react';

import styles from './UpdatedBanner.module.css';

import HoldIcon from '@/assets/icons/icon-no-bg.svg?react';
import LegacyIcon from '@/assets/icons/legacy-icon.svg?react';
import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Stack from '@/components/primitives/Stack';

type ReviewCardProps = {
  onSelectDontShow: () => void;
  onSelectWebStoreLink: () => void;
};

const UpdatedBanner = ({ onSelectDontShow, onSelectWebStoreLink }: ReviewCardProps) => {
  return (
    <Card
      className={styles.updatedBanner}
      as='aside'
      padding
      variant='subtle'
    >
      <Stack gap='small'>
        <header>
          <div className={styles.iconRow}>
            <LegacyIcon />
            <ArrowRight />
            <HoldIcon />
          </div>
          <span>Time Out : Page Blocker</span>

          <span>is now</span>

          <span>Hold</span>
        </header>
        <p>Thank you for your continued support.</p>
        <Button
          onClick={onSelectWebStoreLink}
          variant='secondary'
        >
          View in the Chrome Web Store
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
