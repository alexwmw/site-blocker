import styles from './StatusItem.module.css';

export type StatusTone = 'good' | 'bad' | 'neutral';

type StatusItemProps = {
  label: string;
  value: string;
  tone?: StatusTone;
};

const StatusItem = ({ label, value, tone = 'neutral' }: StatusItemProps) => {
  return (
    <div className={styles.statusItem}>
      <dt className={styles.statusLabel}>{label}</dt>
      <dd className={styles.statusValue}>
        <span className={styles[`pill${tone[0].toUpperCase()}${tone.slice(1)}`]}>{value}</span>
      </dd>
    </div>
  );
};

export default StatusItem;
