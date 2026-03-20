import styles from './StatsGrid.module.css';

import Card from '@/components/ui/Card';

const STATS_TONE_BY_INDEX = ['info', 'success', 'warning'] as const;

type Stats = {
  [label: string]: number;
};

const StatsGrid = ({ stats }: { stats: Stats }) => {
  return (
    <section className={styles.statsGrid}>
      {Object.entries(stats).map(([label, value], index: number) => (
        <Card
          as='article'
          className={styles.stat}
          key={label}
        >
          <span className={styles[STATS_TONE_BY_INDEX[index] ?? 'info']} aria-hidden='true' />
          <div>
            <p className={styles.statText}>{label}</p>
            <strong className={styles.statValue}>{value}</strong>
          </div>
        </Card>
      ))}
    </section>
  );
};

export default StatsGrid;
