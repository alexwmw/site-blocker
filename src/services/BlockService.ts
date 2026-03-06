import type { BlockRule } from '../types/schema';

const defaultRule: BlockRule = {
  id: 'default',
  pattern: 'example.com',
  matchType: 'domain',
  createdAt: new Date().toISOString(),
  enabled: true,
};

export class BlockService {
  /**
   * Return true only for valid http: or https: URLs.
   * Return false for invalid URLs and everything else (chrome://, about:blank, etc).
   * @param url string
   */
  static isSupportedUrl(url: string): boolean {
    return true;
  }

  /**
   * ruleMatchesUrl
   * Immediately return false if rule.enabled is false.
   * Immediately return false if the URL is unsupported.
   * For matchType === 'domain':
   * - Normalise host and pattern to lowercase.
   * - Strip leading www. from both.
   * - Match the exact domain or subdomain (reddit.com should match reddit.com and www.reddit.com and old.reddit.com).
   * For matchType === 'path':
   * - Build target as hostname + pathname (lowercase).
   * - Return true if the target starts with the rule pattern (also lowercase).
   * @param rule BlockRule
   * @param targetUrl string
   */
  static ruleMatchesUrl(rule: BlockRule, targetUrl: string): boolean {
    return true;
  }

  /**
   * Return null for unsupported URLs.
   * Load rules via StorageService.getRules().
   * Return the first matching rule using ruleMatchesUrl, else null.
   * @param targetUrl string
   */
  static async findMatchingRule(targetUrl: string): Promise<BlockRule | null> {
    return defaultRule;
  }
}
