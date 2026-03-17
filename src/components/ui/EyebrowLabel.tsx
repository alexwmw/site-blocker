import type { ReactNode } from 'react';

type EyebrowLabelProps = {
  children: ReactNode;
};

const EyebrowLabel = ({ children }: EyebrowLabelProps) => {
  return <p className='ui-eyebrow'>{children}</p>;
};

export default EyebrowLabel;
