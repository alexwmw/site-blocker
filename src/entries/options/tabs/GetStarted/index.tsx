import clsx from 'clsx';

import OptionsTab from '../OptionsTab';

import styles from './StarterSites.module.css';

import Paragraph from '@/components/primitives/Paragraph';
import Stack from '@/components/primitives/Stack';
import PopularWebsitesSelector from '@/components/shared/PopularWebsitesSelector';
import type { BlockRule } from '@/types/schema';

type GetStartedProps = {
  className: string;
  blockRules: BlockRule[];
  addRule: (rule: BlockRule) => Promise<unknown>;
};

const GetStarted = ({ className, blockRules, addRule }: GetStartedProps) => {
  return (
    <OptionsTab
      className={clsx(styles.starterSites, className)}
      title='About Hold'
    >
      <Stack gap='large'>
        <Stack
          gap='small'
          className={styles.description}
        >
          <Paragraph subtle>
            <strong>Hold</strong> helps you stay focused by gently interrupting distracting websites. When you try to
            visit one, you'll see a hold-to-unblock screen – giving you a moment to decide if you really want to
            continue.
          </Paragraph>
          <Paragraph subtle>
            Start by adding a few common distractions below, then refine your setup in the other tabs.
          </Paragraph>
          <ul>
            <li>
              <Paragraph subtle>
                Use the <strong>Preferences</strong> tab to choose a theme and customize unblock behavior.
              </Paragraph>
            </li>
            <li>
              <Paragraph subtle>
                Use the <strong>Schedule</strong> tab to control when blocking is active.
              </Paragraph>
            </li>
            <li>
              <Paragraph subtle>
                Use the <strong>Rules</strong> tab to review and edit blocked sites.
              </Paragraph>
            </li>
          </ul>
          <h3>How to block sites</h3>
          <Paragraph subtle>
            You can quickly block any site while browsing. Click the extension icon in your toolbar to add the current
            page to your block list, or right-click anywhere on the page and use the context menu.
          </Paragraph>
        </Stack>
        <PopularWebsitesSelector
          blockRules={blockRules}
          addRule={addRule}
        />
      </Stack>
    </OptionsTab>
  );
};

export default GetStarted;
