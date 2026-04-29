import styles from './ReviewCard.module.css';

import chromeWebStoreIcon from '@/assets/images/chrome-web-store.svg';
import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Stack from '@/components/primitives/Stack';

type ReviewCardProps = {
  onSelectDontShow: () => void;
  onSelectReview: () => void;
};

const ReviewCard = ({ onSelectDontShow, onSelectReview }: ReviewCardProps) => {
  return (
    <Card
      className={styles.reviewCard}
      as='aside'
      padding
      variant='subtle'
    >
      <Stack gap='small'>
        <header>
          <img
            src={chromeWebStoreIcon}
            alt=''
          />
          <div>
            <strong>Enjoying Hold?</strong>
          </div>
        </header>
        <div>Please consider leaving a review.</div>
        <Button
          onClick={onSelectReview}
          variant='secondary'
        >
          Leave a review
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

export default ReviewCard;
