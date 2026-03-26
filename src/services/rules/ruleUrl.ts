export function parseSupportedUrl(url: string): URL | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }
    return urlObj;
  } catch {
    return null;
  }
}

export function isSupportedUrl(url: string): boolean {
  return parseSupportedUrl(url) !== null;
}

export function stripWww(host: string): string {
  return host.replace(/^www\./u, '');
}

export function normaliseHost(host: string): string {
  return stripWww(host.trim().toLowerCase());
}

export function normalisePathSegment(pathname: string): string {
  const lowerPath = pathname.toLowerCase();
  if (lowerPath === '/' || lowerPath === '') {
    return '';
  }
  return lowerPath.replace(/\/+$/u, '');
}

export function parseLooseHostPathAndSearch(rawInput: string): { host: string; pathname: string; search: string } {
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

export function isHostMatch(targetHost: string, patternHost: string): boolean {
  return targetHost === patternHost || targetHost.endsWith(`.${patternHost}`);
}
