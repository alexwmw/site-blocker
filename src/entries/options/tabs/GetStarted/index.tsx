import clsx from 'clsx';

import OptionsTab from '../OptionsTab';

import styles from './GetStarted.module.css';

import HoldIcon from '@/assets/icons/icon-no-bg.svg?react';
import Card from '@/components/primitives/Card';
import Paragraph from '@/components/primitives/Paragraph';
import Stack from '@/components/primitives/Stack';
import Hold from '@/components/shared/Hold';
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
      title='Get started'
    >
      <Stack gap='x-small'>
        <Card
          padding
          as='details'
        >
          <summary>About Hold</summary>
          <Paragraph subtle>
            <Hold /> helps you stay focused by gently interrupting distracting websites.
          </Paragraph>
          <Paragraph subtle>
            When you try to visit one, you'll see a hold-to-unblock screen – giving you a moment to decide if you really
            want to continue.
          </Paragraph>
          <Paragraph subtle>
            You can set the hold timer for as long as you want in the <strong>Preferences</strong> tab.
          </Paragraph>
          <Paragraph subtle>
            Start by adding a few common distractions, then refine your setup in the other tabs.
          </Paragraph>
          <ul>
            <li>
              <Paragraph subtle>
                Use the <strong>Rules</strong> tab to review and edit blocked sites.
              </Paragraph>
            </li>
            <li>
              <Paragraph subtle>
                Use the <strong>Schedule</strong> tab to control when blocking is active.
              </Paragraph>
            </li>
            <li>
              <Paragraph subtle>
                Use the <strong>Preferences</strong> tab to choose a theme and customize unblock behavior.
              </Paragraph>
            </li>
          </ul>
        </Card>
        <Card
          padding
          as='details'
        >
          <summary>How to block sites</summary>
          <Paragraph subtle>You can quickly block any site while browsing. </Paragraph>
          <Paragraph subtle>
            Click the extension icon in your toolbar to add the current page to your block list, or right-click anywhere
            on the page and use the options in the <Hold /> menu.
          </Paragraph>
        </Card>
        <Card
          padding
          as='details'
        >
          <summary>Using the Hold button</summary>
          <Paragraph subtle>
            Unlike other site blockers, <Hold /> always enabled you to visit a blocked website if that's what you choose
            to do.
          </Paragraph>
          <Paragraph subtle>
            On the block page, you will see a button with the <Hold /> icon (
            <HoldIcon
              height='1.1rem'
              style={{ padding: '6px 2px 0 2px' }}
            />
            ) which you can hold for a set time to unblock the website temporarily. This pause gives you time to reflect
            on whether you do truly intend to visit the website.
          </Paragraph>
          <Paragraph subtle>
            You can edit the hold duration anytime in <strong>Preferences</strong>.
          </Paragraph>
        </Card>
        <Card padding>
          <summary>Starter sites</summary>
          <Paragraph subtle>Choose common distractions to block in one click.</Paragraph>
          <br />
          <PopularWebsitesSelector
            blockRules={blockRules}
            addRule={addRule}
          />
        </Card>
      </Stack>
    </OptionsTab>
  );
};

export default GetStarted;
