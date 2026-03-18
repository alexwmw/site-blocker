import Card from '../../components/ui/Card';

import styles from './StatsGrid.module.css';

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
