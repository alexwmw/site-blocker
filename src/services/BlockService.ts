import type { BlockRule } from '../types/schema';

import { StorageService } from './StorageService';

export class BlockService {
  /**
   * Return true only for valid http: or https: URLs.
   * Return false for invalid URLs and everything else (chrome://, about:blank, etc).
   * @param url string
   */
  static isSupportedUrl(url: string): boolean {
    try {
      const urlObj: URL = new URL(url);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  private static stripWww(str: string): string {
    return str.replace(/^www\./u, '');
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
    if (!rule.enabled) {
      return false;
    }
    if (!this.isSupportedUrl(targetUrl)) {
      return false;
    }
    try {
      const urlObj: URL = new URL(targetUrl);
      const domain = this.stripWww(urlObj.hostname.toLowerCase());
      const pattern = this.stripWww(rule.pattern.toLowerCase());
      if (rule.matchType === 'domain') {
        return domain === pattern || domain.endsWith(`.${pattern}`);
      }
      const path = urlObj.pathname.toLowerCase();
      if (rule.matchType === 'path') {
        const target = `${domain}${path}`;
        return target.startsWith(pattern);
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Return null for unsupported URLs.
   * Load rules via StorageService.getRules().
   * Return the first matching rule using ruleMatchesUrl, else null.
   * @param targetUrl string
   */
  static async findMatchingRule(targetUrl: string): Promise<BlockRule | null> {
    if (!this.isSupportedUrl(targetUrl)) {
      return null;
    }
    const rules = await StorageService.getRules();
    for (const rule of rules) {
      if (this.ruleMatchesUrl(rule, targetUrl)) {
        return rule;
      }
    }
    return null;
  }
}
