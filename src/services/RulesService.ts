import type { BlockRule } from '@/types/schema';

type QueryMode = 'ignore' | 'include-all' | 'include-selected';

export class RulesService {
  private static readonly QUERY_HARD_NOISE_PARAM_PREFIXES_LOWER = ['utm_'] as const;

  private static readonly QUERY_HARD_NOISE_PARAM_KEYS_LOWER = new Set(['fbclid', 'gclid']);

  private static readonly QUERY_SOFT_NOISE_PARAM_KEYS_LOWER = new Set([
    'ref',
    'source',
    'si',
    'feature',
    'pp',
  ]);

  private static readonly QUERY_STRONG_IDENTITY_KEYS_BY_PRIORITY = ['id', 'v'] as const;

  private static readonly QUERY_SHALLOW_IDENTITY_KEYS_BY_PRIORITY = ['q'] as const;

  private static readonly EMPTY_QUERY_SELECTION = Object.freeze([]) as readonly string[];

  private static readonly QUERY_PARAM_SEPARATOR = '\u0000';

  /**
   * Return true only for valid http: or https: URLs.
   * Return false for invalid URLs and everything else (chrome://, about:blank, etc).
   * @param url string
   */
  static isSupportedUrl(url: string): boolean {
    const parsedUrl = this.parseSupportedUrl(url);
    return parsedUrl !== null;
  }

  private static parseSupportedUrl(url: string): URL | null {
    try {
      const urlObj: URL = new URL(url);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return null;
      }
      return urlObj;
    } catch {
      return null;
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

  private static normalisePathComparable(
    host: string,
    pathname: string,
    search: string = '',
    options: { queryMode?: QueryMode; selectedKeys?: readonly string[] } = {},
  ): string {
    const normalisedSearch = this.normaliseSearch(search, options);
    return `${this.normaliseHost(host)}${this.normalisePathSegment(pathname)}${normalisedSearch}`;
  }

  private static filterQueryPairs(
    pairs: Array<[string, string]>,
    queryMode: QueryMode,
    selectedKeys: readonly string[],
    options: { stripSoftNoise?: boolean } = {},
  ): Array<[string, string]> {
    if (queryMode === 'ignore') {
      return [];
    }

    const stripSoftNoise = options.stripSoftNoise ?? false;
    const selectedKeySet = new Set(selectedKeys.map((key) => key.toLowerCase()));

    return pairs.filter(([key]) => {
      const lowerKey = key.toLowerCase();
      const isHardNoiseKey = this.QUERY_HARD_NOISE_PARAM_KEYS_LOWER.has(lowerKey);
      const isSoftNoiseKey = this.QUERY_SOFT_NOISE_PARAM_KEYS_LOWER.has(lowerKey);
      const hasHardNoisePrefix = this.QUERY_HARD_NOISE_PARAM_PREFIXES_LOWER.some((prefix) => lowerKey.startsWith(prefix));

      if (isHardNoiseKey || hasHardNoisePrefix) {
        return false;
      }

      if (stripSoftNoise && isSoftNoiseKey) {
        return false;
      }

      if (queryMode === 'include-all') {
        return true;
      }

      return selectedKeySet.has(lowerKey);
    });
  }

  private static normaliseSearch(
    search: string,
    options: { queryMode?: QueryMode; selectedKeys?: readonly string[]; stripSoftNoise?: boolean } = {},
  ): string {
    const query = search.replace(/^\?/u, '');
    if (!query) {
      return '';
    }

    const queryMode = options.queryMode ?? 'include-all';
    const selectedKeys = options.selectedKeys ?? this.EMPTY_QUERY_SELECTION;

    const pairs = [...new URLSearchParams(query).entries()];
    const filteredPairs = this.filterQueryPairs(pairs, queryMode, selectedKeys, {
      stripSoftNoise: options.stripSoftNoise,
    });

    if (filteredPairs.length === 0) {
      return '';
    }

    const sortedPairs = filteredPairs.sort(([keyA, valueA], [keyB, valueB]) => {
      if (keyA !== keyB) {
        return keyA.localeCompare(keyB);
      }
      return valueA.localeCompare(valueB);
    });

    const sortedSearchParams = new URLSearchParams();
    sortedPairs.forEach(([key, value]) => sortedSearchParams.append(key, value));
    const normalised = sortedSearchParams.toString();

    return normalised ? `?${normalised}` : '';
  }

  private static firstMatchingKeyByPriority(
    pairs: Array<[string, string]>,
    priorityKeys: readonly string[],
  ): string | null {
    const firstSeenByLower = new Map<string, string>();

    for (const [key] of pairs) {
      const lowerKey = key.toLowerCase();
      if (firstSeenByLower.has(lowerKey)) {
        continue;
      }
      firstSeenByLower.set(lowerKey, key);
    }

    for (const lowerPriorityKey of priorityKeys) {
      const matched = firstSeenByLower.get(lowerPriorityKey);
      if (matched) {
        return matched;
      }
    }

    return null;
  }

  private static parseLooseHostPathAndSearch(rawInput: string): { host: string; pathname: string; search: string } {
    const withoutHash = rawInput.trim().split('#', 1)[0] ?? '';
    const [hostAndPath = '', searchPart = ''] = withoutHash.split('?', 2);
    const withoutProtocol = hostAndPath.replace(/^https?:\/\//u, '');
    const [hostPart = '', ...pathParts] = withoutProtocol.split('/');
    const pathTail = pathParts.join('/');
    const pathname = pathTail ? `/${pathTail}` : '/';
    const search = searchPart ? `?${searchPart}` : '';

    return {
      host: hostPart,
      pathname,
      search,
    };
  }

  private static normalisePatternParts(patternInput: string): { host: string; path: string; query: string } {
    const { host, pathname, search } = this.parseLooseHostPathAndSearch(patternInput);
    return {
      host: this.normaliseHost(host),
      path: this.normalisePathSegment(pathname),
      query: this.normaliseSearch(search, { queryMode: 'include-all' }),
    };
  }

  private static normalisedTargetParts(targetUrl: string): { host: string; path: string; query: string } {
    const urlObj: URL = new URL(targetUrl);
    return {
      host: this.normaliseHost(urlObj.hostname),
      path: this.normalisePathSegment(urlObj.pathname),
      query: this.normaliseSearch(urlObj.search, { queryMode: 'include-all' }),
    };
  }

  private static getAutoQuerySelection(parsedUrl: URL): {
    queryMode: QueryMode;
    selectedKeys: readonly string[];
  } {
    const normalisedPath = this.normalisePathSegment(parsedUrl.pathname);
    const segmentCount = normalisedPath.split('/').filter(Boolean).length;

    const cleanedPairs = this.filterQueryPairs(
      [...parsedUrl.searchParams.entries()],
      'include-all',
      this.EMPTY_QUERY_SELECTION,
      { stripSoftNoise: true },
    );

    const strongIdentityKey = this.firstMatchingKeyByPriority(cleanedPairs, this.QUERY_STRONG_IDENTITY_KEYS_BY_PRIORITY);
    if (strongIdentityKey) {
      return {
        queryMode: 'include-selected',
        selectedKeys: [strongIdentityKey],
      };
    }

    if (segmentCount > 1) {
      return {
        queryMode: 'ignore',
        selectedKeys: this.EMPTY_QUERY_SELECTION,
      };
    }

    const shallowIdentityKey = this.firstMatchingKeyByPriority(
      cleanedPairs,
      this.QUERY_SHALLOW_IDENTITY_KEYS_BY_PRIORITY,
    );
    if (shallowIdentityKey) {
      return {
        queryMode: 'include-selected',
        selectedKeys: [shallowIdentityKey],
      };
    }

    return {
      queryMode: 'ignore',
      selectedKeys: this.EMPTY_QUERY_SELECTION,
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

    const parsed = this.parseSupportedUrl(trimmedInput);

    if (parsed) {
      return this.normalisePathComparable(parsed.hostname, parsed.pathname, parsed.search);
    }

    const { host, pathname, search } = this.parseLooseHostPathAndSearch(trimmedInput);
    return this.normalisePathComparable(host, pathname, search);
  }

  private static normalisePatternForDuplicateDetection(patternInput: string): string {
    const trimmedInput = patternInput.trim();
    const parsed = this.parseSupportedUrl(trimmedInput);

    if (parsed) {
      const autoQuerySelection = this.getAutoQuerySelection(parsed);
      return this.normalisePathComparable(parsed.hostname, parsed.pathname, parsed.search, autoQuerySelection);
    }

    const { host, pathname, search } = this.parseLooseHostPathAndSearch(trimmedInput);
    const syntheticParsed = this.parseSupportedUrl(`https://${host}${pathname}${search}`);
    if (syntheticParsed) {
      const autoQuerySelection = this.getAutoQuerySelection(syntheticParsed);
      return this.normalisePathComparable(host, pathname, search, autoQuerySelection);
    }

    return this.normalisePathComparable(host, pathname, search);
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
    const parsedUrl = this.parseSupportedUrl(targetUrl);

    if (!parsedUrl) {
      return null;
    }

    const autoQuerySelection = this.getAutoQuerySelection(parsedUrl);
    return this.normalisePathComparable(parsedUrl.hostname, parsedUrl.pathname, parsedUrl.search, autoQuerySelection);
  }

  /**
   * Convert a supported URL to a normalised domain pattern.
   * This matches the legacy "Block reddit.com" action.
   */
  static domainPatternFromUrl(targetUrl: string): string | null {
    const parsedUrl = this.parseSupportedUrl(targetUrl);

    if (!parsedUrl) {
      return null;
    }

    return this.normaliseHost(parsedUrl.hostname);
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

    const target = this.normalisedTargetParts(targetUrl);
    const pattern = this.normalisePatternParts(rule.pattern);

    if (!this.isHostMatch(target.host, pattern.host)) {
      return false;
    }

    if (rule.matchType === 'exact') {
      if (target.path !== pattern.path) {
        return false;
      }

      if (!pattern.query) {
        return true;
      }

      return target.query === pattern.query;
    }

    if (rule.matchType === 'prefix') {
      const isPathMatch =
        pattern.path === '' ? true : target.path === pattern.path || target.path.startsWith(`${pattern.path}/`);

      if (!isPathMatch) {
        return false;
      }

      if (!pattern.query) {
        return true;
      }

      return this.queryIncludes(target.query, pattern.query);
    }

    return false;
  }

  private static queryIncludes(targetQuery: string, patternQuery: string): boolean {
    const targetSearchParams = new URLSearchParams(targetQuery.replace(/^\?/u, ''));
    const patternSearchParams = new URLSearchParams(patternQuery.replace(/^\?/u, ''));

    const targetCounts = new Map<string, number>();
    [...targetSearchParams.entries()].forEach(([key, value]) => {
      const token = `${key}${this.QUERY_PARAM_SEPARATOR}${value}`;
      targetCounts.set(token, (targetCounts.get(token) ?? 0) + 1);
    });

    for (const [key, value] of patternSearchParams.entries()) {
      const token = `${key}${this.QUERY_PARAM_SEPARATOR}${value}`;
      const count = targetCounts.get(token) ?? 0;
      if (count <= 0) {
        return false;
      }
      targetCounts.set(token, count - 1);
    }

    return true;
  }

  static splitPattern(pattern: string): { host: string; path: string; query: string } {
    const normalised = RulesService.normalisePatternParts(pattern);
    return { host: normalised.host, path: normalised.path, query: normalised.query };
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
  static findMatchingRules(targetUrl: string, rules: BlockRule[]): BlockRule[] {
    if (!this.isSupportedUrl(targetUrl)) {
      return [];
    }

    return rules.filter((rule) => this.ruleMatchesUrl(rule, targetUrl));
  }

  static findDuplicateRules(compareRule: BlockRule, rules: BlockRule[]): BlockRule[] {
    const normalisedPattern = this.normalisePatternForDuplicateDetection(compareRule.pattern);

    return rules.filter((rule) => this.normalisePatternForDuplicateDetection(rule.pattern) === normalisedPattern);
  }
}
