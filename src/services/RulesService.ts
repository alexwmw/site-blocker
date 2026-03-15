import type { BlockRule } from '../types/schema';

export class RulesService {
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

  private static normaliseHost(host: string): string {
    return this.stripWww(host.trim().toLowerCase());
  }

  private static normalisePathSegment(pathname: string): string {
    const lowerPath = pathname.toLowerCase();
    if (lowerPath === '/' || lowerPath === '') {
      return '';
    }
    return lowerPath.replace(/\/+$/u, '');
  }

  private static normalisePathComparable(host: string, pathname: string): string {
    return `${this.normaliseHost(host)}${this.normalisePathSegment(pathname)}`;
  }

  private static parseLooseHostAndPath(rawInput: string): { host: string; pathname: string } {
    const withoutQueryOrHash = rawInput.trim().toLowerCase().split(/[?#]/u, 1)[0] ?? '';
    const withoutProtocol = withoutQueryOrHash.replace(/^https?:\/\//u, '');
    const [hostPart = '', ...pathParts] = withoutProtocol.split('/');
    const pathTail = pathParts.join('/');
    const pathname = pathTail ? `/${pathTail}` : '/';

    return {
      host: hostPart,
      pathname,
    };
  }

  private static normalisePatternParts(patternInput: string): { host: string; path: string } {
    const { host, pathname } = this.parseLooseHostAndPath(patternInput);
    return {
      host: this.normaliseHost(host),
      path: this.normalisePathSegment(pathname),
    };
  }

  private static normalisedTargetParts(targetUrl: string): { host: string; path: string } {
    const urlObj: URL = new URL(targetUrl);
    return {
      host: this.normaliseHost(urlObj.hostname),
      path: this.normalisePathSegment(urlObj.pathname),
    };
  }

  private static isHostMatch(targetHost: string, patternHost: string): boolean {
    return targetHost === patternHost || targetHost.endsWith(`.${patternHost}`);
  }

  /**
   * Normalise user input (UI text or current tab URL) to a canonical rule pattern.
   * This intentionally does not depend on matchType.
   */
  static normaliseRulePattern(patternInput: string): string {
    const trimmedInput = patternInput.trim();

    if (this.isSupportedUrl(trimmedInput)) {
      const parsed = new URL(trimmedInput);
      return this.normalisePathComparable(parsed.hostname, parsed.pathname);
    }

    const { host, pathname } = this.parseLooseHostAndPath(trimmedInput);
    return this.normalisePathComparable(host, pathname);
  }

  /**
   * Convert a supported URL to a normalised path pattern for new-rule creation flows.
   * This matches the legacy "Block reddit.com/r/path" action.
   */
  static patternFromUrl(targetUrl: string): string | null {
    return this.pathPatternFromUrl(targetUrl);
  }

  /**
   * Convert a supported URL to a normalised path pattern.
   */
  static pathPatternFromUrl(targetUrl: string): string | null {
    if (!this.isSupportedUrl(targetUrl)) {
      return null;
    }
    return this.normaliseRulePattern(targetUrl);
  }

  /**
   * Convert a supported URL to a normalised domain pattern.
   * This matches the legacy "Block reddit.com" action.
   */
  static domainPatternFromUrl(targetUrl: string): string | null {
    if (!this.isSupportedUrl(targetUrl)) {
      return null;
    }
    const parsed = new URL(targetUrl);
    return this.normaliseHost(parsed.hostname);
  }

  /**
   * ruleMatchesUrl
   * Immediately return false if rule.enabled is false.
   * Immediately return false if the URL is unsupported.
   * For matchType === 'exact':
   * - Match exact page only (allowing optional trailing slash).
   * For matchType === 'prefix':
   * - Match exact page and descendants.
   * Host matching always allows exact host and subdomains.
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
      const target = this.normalisedTargetParts(targetUrl);
      const pattern = this.normalisePatternParts(rule.pattern);

      if (!this.isHostMatch(target.host, pattern.host)) {
        return false;
      }

      if (rule.matchType === 'exact') {
        return target.path === pattern.path;
      }

      if (rule.matchType === 'prefix') {
        if (pattern.path === '') {
          return true;
        }
        return target.path === pattern.path || target.path.startsWith(`${pattern.path}/`);
      }

      return false;
    } catch {
      return false;
    }
  }

  static splitPattern(pattern: string): { host: string; path: string } {
    const [host = '', ...pathParts] = RulesService.normaliseRulePattern(pattern).split('/');
    const path = pathParts.length > 0 ? `/${pathParts.join('/')}` : '';
    return { host, path };
  }

  static sortRulesBySpecificity(rules: BlockRule[]): BlockRule[] {
    if (rules.length === 0) {
      return [];
    }

    return [...rules].sort((a, b) => {
      // 1. exact beats prefix
      if (a.matchType !== b.matchType) {
        return a.matchType === 'exact' ? -1 : 1;
      }

      const { host: hostA, path: pathA } = this.splitPattern(a.pattern);
      const { host: hostB, path: pathB } = this.splitPattern(b.pattern);

      // 2. deeper path beats shallower path
      const pathDepthA = pathA.split('/').filter(Boolean).length;
      const pathDepthB = pathB.split('/').filter(Boolean).length;

      if (pathDepthA !== pathDepthB) {
        return pathDepthB - pathDepthA;
      }

      // 3. longer host beats shorter host
      if (hostA.length !== hostB.length) {
        return hostB.length - hostA.length;
      }

      return 0;
    });
  }

  /**
   * Return null for unsupported URLs.
   * Load rules via StorageService.getRules().
   * Return the first matching rule using ruleMatchesUrl, else null.
   * @param targetUrl string
   * @param rules
   */
  static async findMatchingRules(targetUrl: string, rules: BlockRule[]): Promise<BlockRule[]> {
    if (!this.isSupportedUrl(targetUrl)) {
      return [];
    }

    return rules.filter((rule) => this.ruleMatchesUrl(rule, targetUrl));
  }

  static async findDuplicateRules(compareRule: BlockRule, rules: BlockRule[]): Promise<BlockRule[]> {
    const normalisedPattern = this.normaliseRulePattern(compareRule.pattern);

    return rules.filter((rule) => this.normaliseRulePattern(rule.pattern) === normalisedPattern);
  }
}
