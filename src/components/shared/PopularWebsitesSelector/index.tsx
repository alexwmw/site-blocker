import { useMemo, useState } from 'react';

import Button from '@/components/primitives/Button';
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
    <Stack
      gap='small'
      variant={'two-columns'}
    >
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SiteIdentity
                identity={SiteIdentityService.fromUrl(`https://${site}`)}
                size='small'
              />
              <div>{isBlocked ? 'Added' : isPending ? 'Adding…' : 'Block'}</div>
            </div>
          </Button>
        );
      })}
    </Stack>
  );
};

export default PopularWebsitesSelector;
