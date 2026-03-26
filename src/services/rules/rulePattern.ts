import { getAutoQuerySelection, normaliseSearch } from './ruleQuery';
import { normaliseHost, normalisePathSegment, parseLooseHostPathAndSearch, parseSupportedUrl } from './ruleUrl';

export type RulePatternParts = { host: string; path: string; query: string };

export function normalisePathComparable(
  host: string,
  pathname: string,
  search: string = '',
  options: { queryMode?: 'ignore' | 'include-all' | 'include-selected'; selectedKeys?: readonly string[] } = {},
): string {
  const normalisedSearch = normaliseSearch(search, options);
  return `${normaliseHost(host)}${normalisePathSegment(pathname)}${normalisedSearch}`;
}

export function normalisePatternParts(patternInput: string): RulePatternParts {
  const { host, pathname, search } = parseLooseHostPathAndSearch(patternInput);
  return {
    host: normaliseHost(host),
    path: normalisePathSegment(pathname),
    query: normaliseSearch(search, { queryMode: 'include-all' }),
  };
}

export function normalisedTargetParts(targetUrl: string): RulePatternParts {
  const urlObj = new URL(targetUrl);
  return {
    host: normaliseHost(urlObj.hostname),
    path: normalisePathSegment(urlObj.pathname),
    query: normaliseSearch(urlObj.search, { queryMode: 'include-all' }),
  };
}

export function normaliseRulePattern(patternInput: string): string {
  const trimmedInput = patternInput.trim();

  const parsed = parseSupportedUrl(trimmedInput);
  if (parsed) {
    return normalisePathComparable(parsed.hostname, parsed.pathname, parsed.search);
  }

  const { host, pathname, search } = parseLooseHostPathAndSearch(trimmedInput);
  return normalisePathComparable(host, pathname, search);
}

export function normalisePatternForDuplicateDetection(patternInput: string): string {
  const trimmedInput = patternInput.trim();
  const parsed = parseSupportedUrl(trimmedInput);

  if (parsed) {
    const autoQuerySelection = getAutoQuerySelection(parsed);
    return normalisePathComparable(parsed.hostname, parsed.pathname, parsed.search, autoQuerySelection);
  }

  const { host, pathname, search } = parseLooseHostPathAndSearch(trimmedInput);
  const syntheticParsed = parseSupportedUrl(`https://${host}${pathname}${search}`);
  if (syntheticParsed) {
    const autoQuerySelection = getAutoQuerySelection(syntheticParsed);
    return normalisePathComparable(host, pathname, search, autoQuerySelection);
  }

  return normalisePathComparable(host, pathname, search);
}

export function pathPatternFromUrl(targetUrl: string): string | null {
  const parsedUrl = parseSupportedUrl(targetUrl);
  if (!parsedUrl) {
    return null;
  }

  const autoQuerySelection = getAutoQuerySelection(parsedUrl);
  return normalisePathComparable(parsedUrl.hostname, parsedUrl.pathname, parsedUrl.search, autoQuerySelection);
}

export function domainPatternFromUrl(targetUrl: string): string | null {
  const parsedUrl = parseSupportedUrl(targetUrl);
  return parsedUrl ? normaliseHost(parsedUrl.hostname) : null;
}
