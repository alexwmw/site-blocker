import OptionsTab from '../OptionsTab';

import Paragraph from '@/components/primitives/Paragraph';
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
        <Paragraph>
          Hold helps you stay focused by blocking distracting websites and showing a hold-to-unblock screen when you
          try to visit them. Start by adding a few common distractors below, then tune your setup in other tabs.
        </Paragraph>
        <Paragraph subtle>
          Use <strong>Rules</strong> to review and edit blocked sites, <strong>Schedule</strong> to control when
          blocking is active, and <strong>Preferences</strong> to customize themes and unblock behavior.
        </Paragraph>
        <PopularWebsitesSelector
          blockRules={blockRules}
          addRule={addRule}
        />
      </Stack>
    </OptionsTab>
  );
};

export default StarterSites;
