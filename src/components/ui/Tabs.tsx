import clsx from 'clsx';

import styles from './Tabs.module.css';

export type TabItem<T extends string> = {
  id: T;
  label: string;
};

type TabsProps<T extends string> = {
  items: ReadonlyArray<TabItem<T>>;
  activeTab: T;
  onTabChange: (tab: T) => void;
  ariaLabel: string;
  className?: string;
};

const Tabs = <T extends string>({ items, activeTab, onTabChange, ariaLabel, className }: TabsProps<T>) => {
  return (
    <div
      className={clsx(styles.tabs, className)}
      role='tablist'
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const isActive = item.id === activeTab;

        return (
          <button
            key={item.id}
            type='button'
            role='tab'
            aria-selected={isActive}
            className={clsx(styles.tabButton, isActive && styles.tabButtonActive)}
            onClick={() => {
              onTabChange(item.id);
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
