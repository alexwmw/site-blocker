import { RulesService } from './RulesService';

import type { BlockRule } from '@/types/schema';

export type SiteIdentityModel = {
  faviconSources: string[];
  host: string | null;
  label: string;
  path: string;
};

type FaviconMode = 'host' | 'page';

type IdentityOptions = {
  faviconMode?: FaviconMode;
  preferredFaviconUrl?: string | null;
};

export class SiteIdentityService {
  private static dedupe(values: Array<string | null | undefined>): string[] {
    return [...new Set(values.filter((value): value is string => Boolean(value)))];
  }

  private static buildChromeFaviconSrc(pageUrl: string | null): string | null {
    if (!pageUrl) {
      return null;
    }

    const base =
      typeof chrome !== 'undefined' && chrome.runtime?.getURL ? chrome.runtime.getURL('/_favicon/') : '/_favicon/';
    const faviconUrl = new URL(base, window.location.origin);
    faviconUrl.searchParams.set('pageUrl', pageUrl);
    faviconUrl.searchParams.set('size', '32');
    return faviconUrl.toString();
  }

  private static buildDirectFaviconSrc(host: string | null): string | null {
    if (!host) {
      return null;
    }

    return `https://${host}/favicon.ico`;
  }

  private static buildPageUrl(host: string | null, path: string, faviconMode: FaviconMode): string | null {
    if (!host) {
      return null;
    }

    return faviconMode === 'page' ? `https://${host}${path || '/'}` : `https://${host}/`;
  }

  static fromHostAndPath(
    host: string | null,
    path: string | null | undefined,
    options?: IdentityOptions,
  ): SiteIdentityModel {
    const safePath = path && path !== '/' ? path : '';
    const faviconMode = options?.faviconMode ?? 'host';
    const pageUrl = this.buildPageUrl(host, safePath, faviconMode);
    const label = host ? `${host}${safePath}` : 'Unknown site';

    return {
      host,
      path: safePath,
      label,
      faviconSources: this.dedupe([
        options?.preferredFaviconUrl,
        this.buildChromeFaviconSrc(pageUrl),
        this.buildDirectFaviconSrc(host),
      ]),
    };
  }

  static fromRule(rule: Pick<BlockRule, 'pattern'>, options?: IdentityOptions): SiteIdentityModel {
    const { host, path } = RulesService.splitPattern(rule.pattern);
    return this.fromHostAndPath(host || null, path, options);
  }

  static fromUrl(targetUrl: string | null | undefined, options?: IdentityOptions): SiteIdentityModel {
    if (!targetUrl || !RulesService.isSupportedUrl(targetUrl)) {
      return {
        host: null,
        path: '',
        label: targetUrl ?? 'Unknown site',
        faviconSources: this.dedupe([options?.preferredFaviconUrl]),
      };
    }

    const pattern = RulesService.pathPatternFromUrl(targetUrl);
    if (!pattern) {
      return {
        host: null,
        path: '',
        label: targetUrl,
        faviconSources: this.dedupe([options?.preferredFaviconUrl]),
      };
    }

    const { host, path } = RulesService.splitPattern(pattern);
    return this.fromHostAndPath(host || null, path, options);
  }
}
