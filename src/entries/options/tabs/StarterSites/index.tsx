import OptionsTab from '../OptionsTab';

import Stack from '@/components/primitives/Stack';
import PopularWebsitesSelector from '@/components/shared/PopularWebsitesSelector';
import type { BlockRule } from '@/types/schema';

type StarterSitesProps = {
  className: string;
  blockRules: BlockRule[];
  addRule: (rule: BlockRule) => Promise<unknown>;
};

const StarterSites = ({ className, blockRules, addRule }: StarterSitesProps) => {
  return (
    <OptionsTab
      className={className}
      title='Starter sites'
    >
      <Stack gap='small'>
        <PopularWebsitesSelector
          blockRules={blockRules}
          addRule={addRule}
        />
      </Stack>
    </OptionsTab>
  );
};

export default StarterSites;
