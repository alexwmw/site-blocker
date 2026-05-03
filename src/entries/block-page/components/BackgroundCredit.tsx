import styles from './BackgroundCredit.module.css';

import type { Theme } from '@/types/schema';

type PhotoCredit = {
  id: string;
  themes: Theme[];
  author: string;
  url: string;
};

const PHOTO_CREDITS: PhotoCredit[] = [
  {
    id: 'focus',
    themes: ['focus-light', 'focus-dark'],
    author: 'Azim Islam',
    url: 'https://www.pexels.com/photo/bokeh-of-lights-photography-1210276/',
  },
  {
    id: 'rainforest',
    themes: ['rainforest-light', 'rainforest-dark'],
    author: 'Shalender Kumar',
    url: 'https://www.pexels.com/photo/hazy-forest-6741740/',
  },
  {
    id: 'mountains',
    themes: ['mountains-light', 'mountains-dark'],
    author: 'Heinz Klier',
    url: 'https://www.pexels.com/photo/snow-covered-mountains-7119761/',
  },
];

const BackgroundCredit = ({ theme }: { theme?: Theme }) => {
  const credit = theme ? (PHOTO_CREDITS.find((item) => item.themes.includes(theme)) ?? null) : null;

  return credit ? (
    <div className={styles.backgroundCredit}>
      Photo by:{' '}
      <a
        href={credit.url}
        target='_blank'
      >
        {credit.author}
      </a>
    </div>
  ) : null;
};

export default BackgroundCredit;
