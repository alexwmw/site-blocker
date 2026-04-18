import { findDuplicateRules, findMatchingRules, ruleMatchesUrl, sortRulesBySpecificity } from './rules/ruleMatching';
import {
  domainPatternFromUrl,
  normalisePatternParts,
  normaliseRulePattern,
  pathPatternFromUrl,
} from './rules/rulePattern';
import { isSupportedUrl } from './rules/ruleUrl';

import type { BlockRule, MatchType } from '@/types/schema';
import { createUniqueId } from '@/utils/createUniqueId';

/**
 * Thin facade around small rule-focused modules.
 *
 * Keeping this class means we avoid changing callers today,
 * while each behavior now lives in a focused file.
 */
export class RulesService {
  static isSupportedUrl(url: string): boolean {
    return isSupportedUrl(url);
  }

  static normaliseRulePattern(patternInput: string): string {
    return normaliseRulePattern(patternInput);
  }

  static patternFromUrl(targetUrl: string): string | null {
    return this.pathPatternFromUrl(targetUrl);
  }

  static pathPatternFromUrl(targetUrl: string): string | null {
    return pathPatternFromUrl(targetUrl);
  }

  static domainPatternFromUrl(targetUrl: string): string | null {
    return domainPatternFromUrl(targetUrl);
  }

  static ruleMatchesUrl(rule: BlockRule, targetUrl: string): boolean {
    return ruleMatchesUrl(rule, targetUrl);
  }

  static splitPattern(pattern: string): { host: string; path: string; query: string } {
    const normalised = normalisePatternParts(pattern);
    return { host: normalised.host, path: normalised.path, query: normalised.query };
  }

  static sortRulesBySpecificity(rules: BlockRule[]): BlockRule[] {
    return sortRulesBySpecificity(rules);
  }

  static findMatchingRules(targetUrl: string, rules: BlockRule[]): BlockRule[] {
    return findMatchingRules(targetUrl, rules);
  }

  static findDuplicateRules(compareRule: BlockRule, rules: BlockRule[]): BlockRule[] {
    return findDuplicateRules(compareRule, rules);
  }

  static createUrlRule(
    url: string | undefined,
    matchType: MatchType,
    patternType: 'domain' | 'path',
  ): BlockRule | null {
    if (!url || !this.isSupportedUrl(url)) {
      return null;
    }

    const pattern = patternType === 'domain' ? this.domainPatternFromUrl(url) : this.pathPatternFromUrl(url);

    if (!pattern) {
      return null;
    }

    return {
      id: createUniqueId(),
      matchType,
      pattern,
      createdAt: new Date().toISOString(),
      enabled: true,
    };
  }
}
