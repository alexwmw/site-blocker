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
    id: 'mindful',
    themes: ['mindful-light', 'mindful-dark'],
    author: 'James Cheney',
    url: 'https://www.pexels.com/photo/green-leaves-on-a-blurred-background-2524140/',
  },
  {
    id: 'intention',
    themes: ['intention-light', 'intention-dark'],
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
