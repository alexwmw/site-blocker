import { afterEach, describe, expect, it, vi } from 'vitest';

import { RulesService } from './RulesService';
import { StorageService } from './StorageService';

import type { BlockRule } from '@/types/schema';

function makeRule(overrides: Partial<BlockRule> = {}): BlockRule {
  return {
    id: 'rule-1',
    pattern: 'reddit.com',
    matchType: 'prefix',
    createdAt: '2026-03-06T00:00:00.000Z',
    enabled: true,
    ...overrides,
  };
}

describe('BlockService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('isSupportedUrl accepts https urls', () => {
    expect(RulesService.isSupportedUrl('https://reddit.com')).toBe(true);
  });

  it('isSupportedUrl rejects chrome urls', () => {
    expect(RulesService.isSupportedUrl('chrome://extensions')).toBe(false);
  });

  it('ruleMatchesUrl with prefix matches exact page, subdomains, and descendants', () => {
    const rule = makeRule({ pattern: 'reddit.com/r/aita', matchType: 'prefix' });

    expect(RulesService.ruleMatchesUrl(rule, 'https://reddit.com/r/aita')).toBe(true);
    expect(RulesService.ruleMatchesUrl(rule, 'https://www.reddit.com/r/aita')).toBe(true);
    expect(RulesService.ruleMatchesUrl(rule, 'https://old.reddit.com/r/aita/comments/123')).toBe(true);
    expect(RulesService.ruleMatchesUrl(rule, 'https://reddit.com/r/askreddit')).toBe(false);
  });

  it('ruleMatchesUrl with exact matches only the exact page (slash-insensitive)', () => {
    const rule = makeRule({ pattern: 'reddit.com/r/aita', matchType: 'exact' });

    expect(RulesService.ruleMatchesUrl(rule, 'https://old.reddit.com/r/aita')).toBe(true);
    expect(RulesService.ruleMatchesUrl(rule, 'https://old.reddit.com/r/aita/')).toBe(true);
    expect(RulesService.ruleMatchesUrl(rule, 'https://old.reddit.com/r/aita/comments/123')).toBe(false);
  });

  it('ruleMatchesUrl with prefix and domain-only pattern is site-wide', () => {
    const rule = makeRule({ pattern: 'reddit.com', matchType: 'prefix' });

    expect(RulesService.ruleMatchesUrl(rule, 'https://reddit.com')).toBe(true);
    expect(RulesService.ruleMatchesUrl(rule, 'https://reddit.com/r/programming')).toBe(true);
    expect(RulesService.ruleMatchesUrl(rule, 'https://old.reddit.com/r/all')).toBe(true);
    expect(RulesService.ruleMatchesUrl(rule, 'https://example.com')).toBe(false);
  });

  it('ruleMatchesUrl with exact and domain-only pattern matches root only', () => {
    const rule = makeRule({ pattern: 'reddit.com', matchType: 'exact' });

    expect(RulesService.ruleMatchesUrl(rule, 'https://www.reddit.com')).toBe(true);
    expect(RulesService.ruleMatchesUrl(rule, 'https://www.reddit.com/')).toBe(true);
    expect(RulesService.ruleMatchesUrl(rule, 'https://www.reddit.com/r/all')).toBe(false);
  });

  it('ruleMatchesUrl keeps legacy non-query patterns query-agnostic, while still ignoring hashes', () => {
    const exactRule = makeRule({ matchType: 'exact', pattern: 'reddit.com/r/programming' });
    const prefixRule = makeRule({ matchType: 'prefix', pattern: 'reddit.com/r/programming' });

    expect(RulesService.ruleMatchesUrl(exactRule, 'https://reddit.com/r/programming?sort=top')).toBe(true);
    expect(RulesService.ruleMatchesUrl(exactRule, 'https://reddit.com/r/programming#rules')).toBe(true);
    expect(RulesService.ruleMatchesUrl(prefixRule, 'https://reddit.com/r/programming/comments/1#top')).toBe(true);
  });

  it('ruleMatchesUrl with exact query-aware page rules requires query equality', () => {
    const exactRule = makeRule({ matchType: 'exact', pattern: 'youtube.com/watch?v=aaa' });

    expect(RulesService.ruleMatchesUrl(exactRule, 'https://www.youtube.com/watch?v=aaa')).toBe(true);
    expect(RulesService.ruleMatchesUrl(exactRule, 'https://www.youtube.com/watch?v=bbb')).toBe(false);
    expect(RulesService.ruleMatchesUrl(exactRule, 'https://www.youtube.com/watch?v=aaa&t=30')).toBe(false);
  });

  it('ruleMatchesUrl with prefix query-aware rules requires target query to include pattern params', () => {
    const prefixRule = makeRule({ matchType: 'prefix', pattern: 'youtube.com/watch?v=aaa&list=xyz' });

    expect(RulesService.ruleMatchesUrl(prefixRule, 'https://www.youtube.com/watch?v=aaa&list=xyz')).toBe(true);
    expect(RulesService.ruleMatchesUrl(prefixRule, 'https://www.youtube.com/watch?list=xyz&v=aaa&t=30')).toBe(true);
    expect(RulesService.ruleMatchesUrl(prefixRule, 'https://www.youtube.com/watch?v=aaa')).toBe(false);
    expect(RulesService.ruleMatchesUrl(prefixRule, 'https://www.youtube.com/watch?v=bbb&list=xyz')).toBe(false);
  });

  it('ruleMatchesUrl returns false for disabled rules', () => {
    const rule = makeRule({ enabled: false });

    expect(RulesService.ruleMatchesUrl(rule, 'https://reddit.com')).toBe(false);
  });

  it('normaliseRulePattern normalises case, www, slash, keeps query, and drops hash', () => {
    expect(RulesService.normaliseRulePattern('WWW.Reddit.com/R/Typescript/?Sort=top#today')).toBe(
      'reddit.com/r/typescript?Sort=top',
    );
    expect(RulesService.normaliseRulePattern('https://www.Reddit.com/?Sort=top#today')).toBe('reddit.com?Sort=top');
  });

  it('normaliseRulePattern canonicalises query parameter order for duplicate detection', () => {
    expect(RulesService.normaliseRulePattern('https://example.com/watch?b=2&a=1&b=1')).toBe(
      'example.com/watch?a=1&b=1&b=2',
    );
  });

  it('normaliseRulePattern keeps soft-noise params for explicit/manual patterns', () => {
    expect(RulesService.normaliseRulePattern('https://example.com/search?q=react&source=hp')).toBe(
      'example.com/search?q=react&source=hp',
    );
  });

  it('patternFromUrl builds normalised page pattern from current tab URL', () => {
    expect(RulesService.patternFromUrl('https://www.Reddit.com/R/Typescript/?Sort=top#today')).toBe('reddit.com/r/typescript');
    expect(RulesService.patternFromUrl('https://example.com/search?q=react&source=hp')).toBe('example.com/search?q=react');
    expect(RulesService.patternFromUrl('https://example.com/search?query=react')).toBe('example.com/search');
    expect(RulesService.patternFromUrl('https://example.com/view?id=123&tab=info')).toBe('example.com/view?id=123');
    expect(RulesService.patternFromUrl('https://example.com/watch?v=abc&id=123')).toBe('example.com/watch?id=123');
    expect(RulesService.patternFromUrl('https://example.com/watch?v=abc&t=30&pp=xyz')).toBe('example.com/watch?v=abc');
    expect(RulesService.patternFromUrl('https://example.com/docs/article/view?id=abc')).toBe('example.com/docs/article/view?id=abc');
    expect(RulesService.patternFromUrl('https://example.com/docs/article/view?q=react')).toBe('example.com/docs/article/view');
    expect(RulesService.patternFromUrl('https://example.com/docs/article/123?id=abc')).toBe(
      'example.com/docs/article/123?id=abc',
    );
    expect(RulesService.patternFromUrl('chrome://extensions')).toBeNull();
  });

  it('pathPatternFromUrl builds normalised page pattern from current tab URL', () => {
    expect(RulesService.pathPatternFromUrl('https://www.Reddit.com/R/Typescript/?Sort=top#today')).toBe(
      'reddit.com/r/typescript',
    );
    expect(RulesService.pathPatternFromUrl('https://example.com/search?q=react&source=hp')).toBe('example.com/search?q=react');
    expect(RulesService.pathPatternFromUrl('https://example.com/search?query=react')).toBe('example.com/search');
    expect(RulesService.pathPatternFromUrl('https://example.com/view?id=123&tab=info')).toBe('example.com/view?id=123');
    expect(RulesService.pathPatternFromUrl('https://example.com/watch?v=abc&id=123')).toBe('example.com/watch?id=123');
    expect(RulesService.pathPatternFromUrl('https://example.com/watch?v=abc&t=30&pp=xyz')).toBe('example.com/watch?v=abc');
    expect(RulesService.pathPatternFromUrl('https://example.com/docs/article/view?id=abc')).toBe('example.com/docs/article/view?id=abc');
    expect(RulesService.pathPatternFromUrl('https://example.com/docs/article/view?q=react')).toBe('example.com/docs/article/view');
    expect(RulesService.pathPatternFromUrl('https://example.com/docs/article/123?id=abc')).toBe(
      'example.com/docs/article/123?id=abc',
    );
    expect(RulesService.pathPatternFromUrl('chrome://extensions')).toBeNull();
  });

  it('domainPatternFromUrl builds normalised domain pattern from current tab URL', () => {
    expect(RulesService.domainPatternFromUrl('https://www.Reddit.com/R/Typescript/?Sort=top#today')).toBe('reddit.com');
    expect(RulesService.domainPatternFromUrl('chrome://extensions')).toBeNull();
  });

  it('findMatchingRules returns first matching rule from storage', () => {
    const rules: BlockRule[] = [
      makeRule({ id: 'rule-1', pattern: 'news.ycombinator.com', matchType: 'prefix' }),
      makeRule({ id: 'rule-2', pattern: 'reddit.com/r/all', matchType: 'prefix' }),
    ];

    const matches = RulesService.findMatchingRules('https://old.reddit.com/r/all/comments/x', rules);

    expect(matches[0].id).toBe('rule-2');
  });

  it('findMatchingRules returns multiple matching rule from storage', () => {
    const rules: BlockRule[] = [
      makeRule({ id: 'rule-1', pattern: 'news.ycombinator.com', matchType: 'prefix' }),
      makeRule({ id: 'rule-2', pattern: 'reddit.com/r/all', matchType: 'prefix' }),
      makeRule({ id: 'rule-3', pattern: 'https://old.reddit.com/r/all/comments/x', matchType: 'exact' }),
    ];

    const matches = RulesService.findMatchingRules('https://old.reddit.com/r/all/comments/x', rules);

    expect(matches).toHaveLength(2);
    expect(matches[0].id).toBe('rule-2');
    expect(matches[1].id).toBe('rule-3');
  });

  it('findMatchingRules returns empty array for unsupported urls', () => {
    const getRulesSpy = vi.spyOn(StorageService, 'getRules').mockResolvedValue([makeRule()]);

    const matches = RulesService.findMatchingRules('chrome://extensions', []);
    expect(matches).toHaveLength(0);
    expect(getRulesSpy).not.toHaveBeenCalled();
  });

  it('findDuplicateRules returns canonical duplicates regardless of matchType', () => {
    const compareRule = makeRule({
      id: 'rule-new',
      pattern: 'https://www.Reddit.com/r/typescript/?b=2&a=1#today',
      matchType: 'prefix',
    });
    const rules: BlockRule[] = [
      makeRule({ id: 'rule-1', pattern: 'reddit.com/r/typescript?a=1&b=2', matchType: 'exact' }),
      makeRule({ id: 'rule-2', pattern: 'news.ycombinator.com', matchType: 'prefix' }),
    ];

    const duplicates = RulesService.findDuplicateRules(compareRule, rules);

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].id).toBe('rule-1');
  });
});
