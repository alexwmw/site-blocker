import styles from './OnboardingChecklist.module.css';

import Card from '@/components/primitives/Card';

type OnboardingChecklistProps = {
  title: string;
  items: readonly string[];
  className?: string;
};

const OnboardingChecklist = ({ title, items, className }: OnboardingChecklistProps) => {
  return (
    <Card
      as='section'
      padding
      className={className}
    >
      <h2 className={styles.title}>{title}</h2>
      <ol className={styles.list}>
        {items.map((item) => (
          <li
            key={item}
            className={styles.item}
          >
            {item}
          </li>
        ))}
      </ol>
    </Card>
  );
};

export default OnboardingChecklist;
