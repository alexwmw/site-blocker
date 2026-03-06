import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BlockRule } from '../types/schema';

import { BlockService } from './BlockService';
import { StorageService } from './StorageService';

function makeRule(overrides: Partial<BlockRule> = {}): BlockRule {
  return {
    id: 'rule-1',
    pattern: 'reddit.com',
    matchType: 'domain',
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

  it('ruleMatchesUrl matches exact domain and www prefix', () => {
    const rule = makeRule({ pattern: 'reddit.com', matchType: 'domain' });

    expect(BlockService.ruleMatchesUrl(rule, 'https://reddit.com/r/typescript')).toBe(true);
    expect(BlockService.ruleMatchesUrl(rule, 'https://www.reddit.com/r/typescript')).toBe(true);
  });

  it('ruleMatchesUrl matches subdomains for domain rules', () => {
    const rule = makeRule({ pattern: 'reddit.com', matchType: 'domain' });

    expect(BlockService.ruleMatchesUrl(rule, 'https://old.reddit.com/r/all')).toBe(true);
  });

  it('ruleMatchesUrl returns false for disabled rules', () => {
    const rule = makeRule({ enabled: false });

    expect(BlockService.ruleMatchesUrl(rule, 'https://reddit.com')).toBe(false);
  });

  it('ruleMatchesUrl supports path-prefix matching', () => {
    const rule = makeRule({ matchType: 'path', pattern: 'reddit.com/r/' });

    expect(BlockService.ruleMatchesUrl(rule, 'https://reddit.com/r/programming')).toBe(true);
    expect(BlockService.ruleMatchesUrl(rule, 'https://reddit.com/user/spez')).toBe(false);
  });

  it('findMatchingRule returns first matching rule from storage', async () => {
    const rules: BlockRule[] = [
      makeRule({ id: 'rule-1', pattern: 'news.ycombinator.com' }),
      makeRule({ id: 'rule-2', pattern: 'reddit.com' }),
    ];
    vi.spyOn(StorageService, 'getRules').mockResolvedValue(rules);

    const match = await BlockService.findMatchingRule('https://old.reddit.com/r/all');

    expect(match?.id).toBe('rule-2');
  });

  it('findMatchingRule returns null for unsupported urls', async () => {
    const getRulesSpy = vi.spyOn(StorageService, 'getRules').mockResolvedValue([makeRule()]);

    const match = await BlockService.findMatchingRule('chrome://extensions');

    expect(match).toBeNull();
    expect(getRulesSpy).not.toHaveBeenCalled();
  });
});
