import { normalisePatternForDuplicateDetection, normalisePatternParts, normalisedTargetParts } from './rulePattern';
import { QUERY_PARAM_SEPARATOR } from './ruleQuery';
import { isHostMatch, isSupportedUrl } from './ruleUrl';

import type { BlockRule } from '@/types/schema';

export function queryIncludes(targetQuery: string, patternQuery: string): boolean {
  const targetSearchParams = new URLSearchParams(targetQuery.replace(/^\?/u, ''));
  const patternSearchParams = new URLSearchParams(patternQuery.replace(/^\?/u, ''));

  const targetCounts = new Map<string, number>();
  [...targetSearchParams.entries()].forEach(([key, value]) => {
    const token = `${key}${QUERY_PARAM_SEPARATOR}${value}`;
    targetCounts.set(token, (targetCounts.get(token) ?? 0) + 1);
  });

  for (const [key, value] of patternSearchParams.entries()) {
    const token = `${key}${QUERY_PARAM_SEPARATOR}${value}`;
    const count = targetCounts.get(token) ?? 0;
    if (count <= 0) {
      return false;
    }
    targetCounts.set(token, count - 1);
  }

  return true;
}

export function ruleMatchesUrl(rule: BlockRule, targetUrl: string): boolean {
  if (!rule.enabled || !isSupportedUrl(targetUrl)) {
    return false;
  }

  const target = normalisedTargetParts(targetUrl);
  const pattern = normalisePatternParts(rule.pattern);

  if (!isHostMatch(target.host, pattern.host)) {
    return false;
  }

  if (rule.matchType === 'exact') {
    if (target.path !== pattern.path) {
      return false;
    }
    return !pattern.query || target.query === pattern.query;
  }

  if (rule.matchType === 'prefix') {
    const isPathMatch = pattern.path === '' ? true : target.path === pattern.path || target.path.startsWith(`${pattern.path}/`);

    if (!isPathMatch) {
      return false;
    }

    return !pattern.query || queryIncludes(target.query, pattern.query);
  }

  return false;
}

export function sortRulesBySpecificity(rules: BlockRule[]): BlockRule[] {
  if (rules.length === 0) {
    return [];
  }

  return [...rules].sort((a, b) => {
    if (a.matchType !== b.matchType) {
      return a.matchType === 'exact' ? -1 : 1;
    }

    const { host: hostA, path: pathA } = normalisePatternParts(a.pattern);
    const { host: hostB, path: pathB } = normalisePatternParts(b.pattern);

    const pathDepthA = pathA.split('/').filter(Boolean).length;
    const pathDepthB = pathB.split('/').filter(Boolean).length;
    if (pathDepthA !== pathDepthB) {
      return pathDepthB - pathDepthA;
    }

    if (hostA.length !== hostB.length) {
      return hostB.length - hostA.length;
    }

    return 0;
  });
}

export function findMatchingRules(targetUrl: string, rules: BlockRule[]): BlockRule[] {
  if (!isSupportedUrl(targetUrl)) {
    return [];
  }

  return rules.filter((rule) => ruleMatchesUrl(rule, targetUrl));
}

export function findDuplicateRules(compareRule: BlockRule, rules: BlockRule[]): BlockRule[] {
  const normalisedPattern = normalisePatternForDuplicateDetection(compareRule.pattern);
  return rules.filter((rule) => normalisePatternForDuplicateDetection(rule.pattern) === normalisedPattern);
}
