import styles from './StatsGrid.module.css';

import Card from '@/components/primitives/Card';

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
          key={index}
        >
          <p className={styles.statText}>{label}</p>
          <strong className={styles.statValue}>{value}</strong>
        </Card>
      ))}
    </section>
  );
};

export default StatsGrid;
