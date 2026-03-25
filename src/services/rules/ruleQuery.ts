import { normalisePathSegment } from './ruleUrl';

export type QueryMode = 'ignore' | 'include-all' | 'include-selected';

const QUERY_HARD_NOISE_PARAM_PREFIXES_LOWER = ['utm_'] as const;
const QUERY_HARD_NOISE_PARAM_KEYS_LOWER = new Set(['fbclid', 'gclid']);
const QUERY_SOFT_NOISE_PARAM_KEYS_LOWER = new Set(['ref', 'source', 'si', 'feature', 'pp']);
const QUERY_STRONG_IDENTITY_KEYS_BY_PRIORITY = ['id', 'v'] as const;
const QUERY_SHALLOW_IDENTITY_KEYS_BY_PRIORITY = ['q'] as const;
const EMPTY_QUERY_SELECTION = Object.freeze([]) as readonly string[];

export const QUERY_PARAM_SEPARATOR = '\u0000';

export function filterQueryPairs(
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
    const isHardNoiseKey = QUERY_HARD_NOISE_PARAM_KEYS_LOWER.has(lowerKey);
    const isSoftNoiseKey = QUERY_SOFT_NOISE_PARAM_KEYS_LOWER.has(lowerKey);
    const hasHardNoisePrefix = QUERY_HARD_NOISE_PARAM_PREFIXES_LOWER.some((prefix) => lowerKey.startsWith(prefix));

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

export function normaliseSearch(
  search: string,
  options: { queryMode?: QueryMode; selectedKeys?: readonly string[]; stripSoftNoise?: boolean } = {},
): string {
  const query = search.replace(/^\?/u, '');
  if (!query) {
    return '';
  }

  const queryMode = options.queryMode ?? 'include-all';
  const selectedKeys = options.selectedKeys ?? EMPTY_QUERY_SELECTION;

  const pairs = [...new URLSearchParams(query).entries()];
  const filteredPairs = filterQueryPairs(pairs, queryMode, selectedKeys, {
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

function firstMatchingKeyByPriority(pairs: Array<[string, string]>, priorityKeys: readonly string[]): string | null {
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

export function getAutoQuerySelection(parsedUrl: URL): { queryMode: QueryMode; selectedKeys: readonly string[] } {
  const normalisedPath = normalisePathSegment(parsedUrl.pathname);
  const segmentCount = normalisedPath.split('/').filter(Boolean).length;

  const cleanedPairs = filterQueryPairs([...parsedUrl.searchParams.entries()], 'include-all', EMPTY_QUERY_SELECTION, {
    stripSoftNoise: true,
  });

  const strongIdentityKey = firstMatchingKeyByPriority(cleanedPairs, QUERY_STRONG_IDENTITY_KEYS_BY_PRIORITY);
  if (strongIdentityKey) {
    return {
      queryMode: 'include-selected',
      selectedKeys: [strongIdentityKey],
    };
  }

  if (segmentCount > 1) {
    return {
      queryMode: 'ignore',
      selectedKeys: EMPTY_QUERY_SELECTION,
    };
  }

  const shallowIdentityKey = firstMatchingKeyByPriority(cleanedPairs, QUERY_SHALLOW_IDENTITY_KEYS_BY_PRIORITY);
  if (shallowIdentityKey) {
    return {
      queryMode: 'include-selected',
      selectedKeys: [shallowIdentityKey],
    };
  }

  return {
    queryMode: 'ignore',
    selectedKeys: EMPTY_QUERY_SELECTION,
  };
}
