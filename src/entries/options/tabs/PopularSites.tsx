import clsx from 'clsx';
import { useMemo, useState } from 'react';

import styles from '../OptionsApp.module.css';
import OptionsTab from '../OptionsTab';

import PopularSiteIcon from '@/components/popular-sites/PopularSiteIcon';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { POPULAR_SITE_CATEGORIES, POPULAR_SITE_CATEGORY_LABELS, POPULAR_SITES } from '@/data/popularSites';
import { RulesService } from '@/services/RulesService';
import type { AddRuleResult } from '@/services/StorageService';
import type { BlockRule, PopularSite, PopularSiteCategory, PopularSiteIcon as PopularSiteIconToken } from '@/types/schema';
import { createUniqueId } from '@/utils/createUniqueId';

type PopularSitesProps = {
  addRule: (rule: BlockRule) => Promise<AddRuleResult>;
  blockRules: BlockRule[];
  className: string;
  removeRule: (id: string) => Promise<void>;
};

type LastAddAction = {
  ruleIds: string[];
  siteDisplayNames: string[];
};

const ALL_CATEGORIES = 'all';
const ALL_CATEGORY_ICON: PopularSiteIconToken = 'sparkles';

type CategoryFilter = PopularSiteCategory | typeof ALL_CATEGORIES;

const createSiteRules = (site: PopularSite, existingPatterns: Set<string>): BlockRule[] => {
  return site.domainPatterns.flatMap((pattern) => {
    const normalisedPattern = RulesService.normaliseRulePattern(pattern);

    if (existingPatterns.has(normalisedPattern)) {
      return [];
    }

    existingPatterns.add(normalisedPattern);

    return [
      {
        id: createUniqueId(),
        pattern,
        matchType: 'prefix',
        createdAt: new Date().toISOString(),
        enabled: true,
      } satisfies BlockRule,
    ];
  });
};

const formatAddedSummary = (siteDisplayNames: string[]) => {
  if (siteDisplayNames.length === 1) {
    return `Added ${siteDisplayNames[0]} to your blocklist.`;
  }

  return `Added ${siteDisplayNames.length} sites to your blocklist.`;
};

const PopularSites = ({ addRule, blockRules, className, removeRule }: PopularSitesProps) => {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [lastAddAction, setLastAddAction] = useState<LastAddAction | null>(null);

  const normalisedExistingPatterns = useMemo(() => {
    return new Set(blockRules.map((rule) => RulesService.normaliseRulePattern(rule.pattern)));
  }, [blockRules]);

  const siteModels = useMemo(() => {
    return POPULAR_SITES.map((site) => {
      const missingPatterns = site.domainPatterns.filter(
        (pattern) => !normalisedExistingPatterns.has(RulesService.normaliseRulePattern(pattern)),
      );
      const categoryLabel = POPULAR_SITE_CATEGORY_LABELS[site.category];
      const searchValue = `${site.displayName} ${categoryLabel} ${site.domainPatterns.join(' ')}`.toLowerCase();

      return {
        ...site,
        categoryLabel,
        isFullyBlocked: missingPatterns.length === 0,
        missingPatterns,
        searchValue,
      };
    });
  }, [normalisedExistingPatterns]);

  const filteredSites = useMemo(() => {
    const normalisedQuery = searchQuery.trim().toLowerCase();

    return siteModels.filter((site) => {
      const categoryMatches = activeCategory === ALL_CATEGORIES || site.category === activeCategory;
      const queryMatches = normalisedQuery.length === 0 || site.searchValue.includes(normalisedQuery);

      return categoryMatches && queryMatches;
    });
  }, [activeCategory, searchQuery, siteModels]);

  const selectedSites = useMemo(() => {
    const selectedSiteIdSet = new Set(selectedSiteIds);
    return siteModels.filter((site) => selectedSiteIdSet.has(site.id) && !site.isFullyBlocked);
  }, [selectedSiteIds, siteModels]);

  const availableVisibleSites = filteredSites.filter((site) => !site.isFullyBlocked);
  const selectedCount = selectedSites.length;
  const addButtonLabel =
    selectedCount === 0 ? 'Add selected' : `Add ${selectedCount} site${selectedCount === 1 ? '' : 's'}`;

  const handleToggleSite = (siteId: string) => {
    setSelectedSiteIds((currentSelected) => {
      if (currentSelected.includes(siteId)) {
        return currentSelected.filter((selectedId) => selectedId !== siteId);
      }

      return [...currentSelected, siteId];
    });
  };

  const handleSelectVisible = () => {
    const visibleIds = availableVisibleSites.map((site) => site.id);
    setSelectedSiteIds((currentSelected) => Array.from(new Set([...currentSelected, ...visibleIds])));
  };

  const handleClearSelection = () => {
    setSelectedSiteIds([]);
  };

  const handleAddSelected = async () => {
    if (selectedSites.length === 0) {
      return;
    }

    setIsSubmitting(true);
    const existingPatterns = new Set(normalisedExistingPatterns);
    const addedRuleIds: string[] = [];
    const addedSiteDisplayNames: string[] = [];

    try {
      for (const site of selectedSites) {
        const siteRules = createSiteRules(site, existingPatterns);
        let addedForSite = false;

        for (const rule of siteRules) {
          const result = await addRule(rule);

          if (result.ok) {
            addedRuleIds.push(rule.id);
            addedForSite = true;
          }
        }

        if (addedForSite) {
          addedSiteDisplayNames.push(site.displayName);
        }
      }

      setSelectedSiteIds((currentSelected) =>
        currentSelected.filter((selectedId) => !selectedSites.some((site) => site.id === selectedId)),
      );
      setLastAddAction(addedRuleIds.length > 0 ? { ruleIds: addedRuleIds, siteDisplayNames: addedSiteDisplayNames } : null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (!lastAddAction) {
      return;
    }

    setIsUndoing(true);

    try {
      await Promise.all(lastAddAction.ruleIds.map(async (ruleId) => removeRule(ruleId)));
      setLastAddAction(null);
    } finally {
      setIsUndoing(false);
    }
  };

  const categoryButtons: ReadonlyArray<{ id: CategoryFilter; icon: PopularSiteIconToken; label: string }> = [
    { id: ALL_CATEGORIES, label: 'All', icon: ALL_CATEGORY_ICON },
    ...POPULAR_SITE_CATEGORIES,
  ];

  return (
    <OptionsTab
      title='Popular Sites'
      className={className}
    >
      <Card className={styles.popularSitesIntroCard}>
        <div className={styles.popularSitesIntroCopy}>
          <p className={styles.rulePattern}>Curated site shortcuts</p>
          <p className={styles.subtle}>
            Quickly add common distractions to your blocklist. Regional domains like Amazon UK can live alongside their
            main site, so this shared catalog can power onboarding later without reshaping the data.
          </p>
        </div>
        <div className={styles.popularSitesActionRow}>
          <Button
            variant='secondary'
            onClick={handleSelectVisible}
            disabled={availableVisibleSites.length === 0 || isSubmitting}
          >
            Select visible
          </Button>
          <Button
            variant='ghost'
            onClick={handleClearSelection}
            disabled={selectedSiteIds.length === 0 || isSubmitting}
          >
            Clear
          </Button>
          <Button
            className={styles.popularSitesPrimaryAction}
            onClick={() => {
              handleAddSelected().catch(console.error);
            }}
            disabled={selectedCount === 0 || isSubmitting}
          >
            {isSubmitting ? 'Adding…' : addButtonLabel}
          </Button>
        </div>
      </Card>

      {lastAddAction ? (
        <Card
          className={styles.popularSitesConfirmation}
          aria-live='polite'
        >
          <div>
            <p className={styles.popularSitesConfirmationTitle}>{formatAddedSummary(lastAddAction.siteDisplayNames)}</p>
            <p className={styles.subtle}>Duplicates were skipped automatically, and you can undo this batch once.</p>
          </div>
          <Button
            variant='secondary'
            onClick={() => {
              handleUndo().catch(console.error);
            }}
            disabled={isUndoing}
          >
            {isUndoing ? 'Undoing…' : 'Undo'}
          </Button>
        </Card>
      ) : null}

      <Card className={styles.popularSitesToolbar}>
        <label className={styles.settingsLabel}>
          Search popular sites
          <input
            className={styles.settingsInput}
            type='search'
            placeholder='Search by site or domain'
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
            }}
          />
          <span className={styles.fieldHint}>Search by display name, category, or domain pattern.</span>
        </label>

        <div>
          <p className={styles.popularSitesFilterLabel}>Category</p>
          <div className={styles.presetRow}>
            {categoryButtons.map((category) => (
              <Button
                key={category.id}
                variant='secondary'
                selected={activeCategory === category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                }}
              >
                <span className={styles.popularSitesCategoryButtonContent}>
                  <PopularSiteIcon
                    icon={category.icon}
                    className={styles.popularSitesCategoryButtonIcon}
                  />
                  <span>{category.label}</span>
                </span>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {filteredSites.length === 0 ? (
        <Card className={styles.emptyState}>
          <p>No popular sites match your current filters.</p>
          <p className={styles.subtle}>Try a different category or broaden your search.</p>
        </Card>
      ) : (
        <ul className={styles.popularSitesGrid}>
          {filteredSites.map((site) => {
            const isSelected = selectedSiteIds.includes(site.id);

            return (
              <li key={site.id}>
                <Card className={clsx(styles.popularSiteCard, isSelected && styles.popularSiteCardSelected)}>
                  <label className={styles.popularSiteCheckboxLabel}>
                    <input
                      type='checkbox'
                      checked={isSelected}
                      disabled={site.isFullyBlocked || isSubmitting}
                      onChange={() => {
                        handleToggleSite(site.id);
                      }}
                    />
                    <div className={styles.popularSiteCardBody}>
                      <div className={styles.popularSiteHeadingRow}>
                        <div className={styles.popularSiteTitleRow}>
                          <span className={styles.popularSiteIconWrap}>
                            <PopularSiteIcon icon={site.icon} />
                          </span>
                          <div>
                            <p className={styles.rulePattern}>{site.displayName}</p>
                            <p className={styles.ruleMeta}>{site.categoryLabel}</p>
                          </div>
                        </div>
                        <span
                          className={clsx(
                            site.isFullyBlocked
                              ? styles.popularSiteStatusBadgeMuted
                              : isSelected
                                ? styles.popularSiteStatusBadgeSelected
                                : styles.popularSiteStatusBadge,
                          )}
                        >
                          {site.isFullyBlocked ? 'Already added' : isSelected ? 'Selected' : 'Ready to add'}
                        </span>
                      </div>
                      <p className={styles.ruleMeta}>{site.domainPatterns.join(' • ')}</p>
                    </div>
                  </label>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </OptionsTab>
  );
};

export default PopularSites;
