import type { ReactNode } from 'react';

type SectionHeaderProps = {
  title: ReactNode;
  status?: ReactNode;
};

const SectionHeader = ({ title, status }: SectionHeaderProps) => {
  return (
    <div className='ui-section-header'>
      <h2>{title}</h2>
      {status}
    </div>
  );
};

export default SectionHeader;
