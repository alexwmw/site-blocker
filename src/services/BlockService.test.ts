import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BlockRule } from '../types/schema';

import { BlockService } from './BlockService';
import { StorageService } from './StorageService';

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
    expect(BlockService.isSupportedUrl('https://reddit.com')).toBe(true);
  });

  it('isSupportedUrl rejects chrome urls', () => {
    expect(BlockService.isSupportedUrl('chrome://extensions')).toBe(false);
  });

  it('ruleMatchesUrl with prefix matches exact page, subdomains, and descendants', () => {
    const rule = makeRule({ pattern: 'reddit.com/r/aita', matchType: 'prefix' });

    expect(BlockService.ruleMatchesUrl(rule, 'https://reddit.com/r/aita')).toBe(true);
    expect(BlockService.ruleMatchesUrl(rule, 'https://www.reddit.com/r/aita')).toBe(true);
    expect(BlockService.ruleMatchesUrl(rule, 'https://old.reddit.com/r/aita/comments/123')).toBe(true);
    expect(BlockService.ruleMatchesUrl(rule, 'https://reddit.com/r/askreddit')).toBe(false);
  });

  it('ruleMatchesUrl with exact matches only the exact page (slash-insensitive)', () => {
    const rule = makeRule({ pattern: 'reddit.com/r/aita', matchType: 'exact' });

    expect(BlockService.ruleMatchesUrl(rule, 'https://old.reddit.com/r/aita')).toBe(true);
    expect(BlockService.ruleMatchesUrl(rule, 'https://old.reddit.com/r/aita/')).toBe(true);
    expect(BlockService.ruleMatchesUrl(rule, 'https://old.reddit.com/r/aita/comments/123')).toBe(false);
  });

  it('ruleMatchesUrl with prefix and domain-only pattern is site-wide', () => {
    const rule = makeRule({ pattern: 'reddit.com', matchType: 'prefix' });

    expect(BlockService.ruleMatchesUrl(rule, 'https://reddit.com')).toBe(true);
    expect(BlockService.ruleMatchesUrl(rule, 'https://reddit.com/r/programming')).toBe(true);
    expect(BlockService.ruleMatchesUrl(rule, 'https://old.reddit.com/r/all')).toBe(true);
    expect(BlockService.ruleMatchesUrl(rule, 'https://example.com')).toBe(false);
  });

  it('ruleMatchesUrl with exact and domain-only pattern matches root only', () => {
    const rule = makeRule({ pattern: 'reddit.com', matchType: 'exact' });

    expect(BlockService.ruleMatchesUrl(rule, 'https://www.reddit.com')).toBe(true);
    expect(BlockService.ruleMatchesUrl(rule, 'https://www.reddit.com/')).toBe(true);
    expect(BlockService.ruleMatchesUrl(rule, 'https://www.reddit.com/r/all')).toBe(false);
  });

  it('ruleMatchesUrl ignores query string and hash for exact and prefix rules', () => {
    const exactRule = makeRule({ matchType: 'exact', pattern: 'reddit.com/r/programming' });
    const prefixRule = makeRule({ matchType: 'prefix', pattern: 'reddit.com/r/programming' });

    expect(BlockService.ruleMatchesUrl(exactRule, 'https://reddit.com/r/programming?sort=top')).toBe(true);
    expect(BlockService.ruleMatchesUrl(exactRule, 'https://reddit.com/r/programming#rules')).toBe(true);
    expect(BlockService.ruleMatchesUrl(prefixRule, 'https://reddit.com/r/programming/comments/1#top')).toBe(true);
  });

  it('ruleMatchesUrl returns false for disabled rules', () => {
    const rule = makeRule({ enabled: false });

    expect(BlockService.ruleMatchesUrl(rule, 'https://reddit.com')).toBe(false);
  });

  it('normaliseRulePattern normalises case, www, slash, and query/hash', () => {
    expect(BlockService.normaliseRulePattern('WWW.Reddit.com/R/Typescript/?Sort=top#today')).toBe(
      'reddit.com/r/typescript',
    );
    expect(BlockService.normaliseRulePattern('https://www.Reddit.com/?Sort=top#today')).toBe('reddit.com');
  });

  it('patternFromUrl builds normalised page pattern from current tab URL', () => {
    expect(BlockService.patternFromUrl('https://www.Reddit.com/R/Typescript/?Sort=top#today')).toBe(
      'reddit.com/r/typescript',
    );
    expect(BlockService.patternFromUrl('chrome://extensions')).toBeNull();
  });

  it('pathPatternFromUrl builds normalised page pattern from current tab URL', () => {
    expect(BlockService.pathPatternFromUrl('https://www.Reddit.com/R/Typescript/?Sort=top#today')).toBe(
      'reddit.com/r/typescript',
    );
    expect(BlockService.pathPatternFromUrl('chrome://extensions')).toBeNull();
  });

  it('domainPatternFromUrl builds normalised domain pattern from current tab URL', () => {
    expect(BlockService.domainPatternFromUrl('https://www.Reddit.com/R/Typescript/?Sort=top#today')).toBe('reddit.com');
    expect(BlockService.domainPatternFromUrl('chrome://extensions')).toBeNull();
  });

  it('findMatchingRule returns first matching rule from storage', async () => {
    const rules: BlockRule[] = [
      makeRule({ id: 'rule-1', pattern: 'news.ycombinator.com', matchType: 'prefix' }),
      makeRule({ id: 'rule-2', pattern: 'reddit.com/r/all', matchType: 'prefix' }),
    ];
    vi.spyOn(StorageService, 'getRules').mockResolvedValue(rules);

    const match = await BlockService.findMatchingRule('https://old.reddit.com/r/all/comments/x');

    expect(match?.id).toBe('rule-2');
  });

  it('findMatchingRule returns null for unsupported urls', async () => {
    const getRulesSpy = vi.spyOn(StorageService, 'getRules').mockResolvedValue([makeRule()]);

    const match = await BlockService.findMatchingRule('chrome://extensions');

    expect(match).toBeNull();
    expect(getRulesSpy).not.toHaveBeenCalled();
  });
});
