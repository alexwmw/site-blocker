import { useMemo, useState } from 'react';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import Paragraph from '@/components/primitives/Paragraph';
import Stack from '@/components/primitives/Stack';
import SiteIdentity from '@/components/shared/SiteIdentity';
import { POPULAR_WEBSITES } from '@/services/popularWebsites';
import { RulesService } from '@/services/RulesService';
import { SiteIdentityService } from '@/services/SiteIdentityService';
import type { BlockRule } from '@/types/schema';

type PopularWebsitesSelectorProps = {
  blockRules: BlockRule[];
  addRule: (rule: BlockRule) => Promise<unknown>;
};

const PopularWebsitesSelector = ({ addRule, blockRules }: PopularWebsitesSelectorProps) => {
  const [pendingSite, setPendingSite] = useState<string | null>(null);

  const alreadyBlockedSites = useMemo(() => {
    return new Set(
      blockRules
        .filter((rule) => rule.matchType === 'prefix')
        .map((rule) => RulesService.splitPattern(rule.pattern).host),
    );
  }, [blockRules]);

  const handleAddSite = async (site: string) => {
    setPendingSite(site);
    try {
      const rule = RulesService.createUrlRule(`https://${site}`, 'prefix', 'domain');

      if (!rule) {
        return;
      }

      await addRule(rule);
    } finally {
      setPendingSite(null);
    }
  };

  return (
    <Card padding>
      <Stack gap='small'>
        <div>
          <h3>Popular websites</h3>
          <Paragraph subtle>Choose common distractions to block in one click.</Paragraph>
        </div>
        <Stack gap='small'>
          {POPULAR_WEBSITES.map((site) => {
            const isBlocked = alreadyBlockedSites.has(site);
            const isPending = pendingSite === site;

            return (
              <Button
                key={site}
                variant={isBlocked ? 'secondary' : 'ghost'}
                disabled={isBlocked || Boolean(pendingSite)}
                onClick={() => {
                  handleAddSite(site).catch(console.error);
                }}
              >
                <div>
                  <SiteIdentity
                    identity={SiteIdentityService.fromUrl(`https://${site}`)}
                    size='small'
                  />
                  <div>{isBlocked ? 'Already blocked' : isPending ? 'Adding…' : 'Block site'}</div>
                </div>
              </Button>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
};

export default PopularWebsitesSelector;
