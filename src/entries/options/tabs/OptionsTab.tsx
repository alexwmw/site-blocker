import type { ComponentProps } from 'react';

import SectionHeader from '@/components/shared/SectionHeader';

const OptionsTab = ({ title, ...props }: { title: string } & ComponentProps<'section'>) => {
  return (
    <section {...props}>
      <SectionHeader title={title} />
      {props.children}
    </section>
  );
};

export default OptionsTab;
