import type { ComponentProps } from 'react';

import SectionHeader from '../../components/ui/SectionHeader';

import styles from './OptionsApp.module.css';

const OptionsTab = ({
  title,
  isContentLoaded,
  ...props
}: { title: string; isContentLoaded: boolean } & ComponentProps<'section'>) => {
  return (
    <section {...props}>
      <SectionHeader
        title={title}
        status={isContentLoaded ? <span className={styles.subtle}>Loading…</span> : null}
      />
      {props.children}
    </section>
  );
};

export default OptionsTab;
