import { RulesService } from './RulesService';

import type { BlockRule } from '@/types/schema';

export type SiteIdentityModel = {
  faviconSources: string[];
  host: string | null;
  label: string;
  path: string;
};

type IdentityOptions = {
  preferredFaviconUrl?: string | null;
};

type ParsedDisplayUrl = {
  faviconPageUrl: string;
  host: string;
  path: string;
  providerHost: string;
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

  private static buildGoogleFaviconSrc(host: string | null): string | null {
    if (!host) {
      return null;
    }

    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
  }

  private static buildDirectFaviconSrc(pageUrl: string | null): string | null {
    if (!pageUrl) {
      return null;
    }

    return new URL('/favicon.ico', pageUrl).toString();
  }

  private static parseDisplayUrl(targetUrl: string): ParsedDisplayUrl | null {
    if (!RulesService.isSupportedUrl(targetUrl)) {
      return null;
    }

    const parsedUrl = new URL(targetUrl);
    return {
      faviconPageUrl: parsedUrl.toString(),
      host: parsedUrl.host,
      path: parsedUrl.pathname === '/' ? '' : parsedUrl.pathname,
      providerHost: parsedUrl.hostname,
    };
  }

  static fromHostAndPath(
    host: string | null,
    path: string | null | undefined,
    options?: IdentityOptions,
  ): SiteIdentityModel {
    const safePath = path && path !== '/' ? path : '';
    const label = host ? `${host}${safePath}` : 'Unknown site';
    const pageUrl = host ? `https://${host}${safePath || '/'}` : null;

    return {
      host,
      path: safePath,
      label,
      faviconSources: this.dedupe([
        options?.preferredFaviconUrl,
        this.buildChromeFaviconSrc(pageUrl),
        this.buildGoogleFaviconSrc(host),
        this.buildDirectFaviconSrc(pageUrl),
      ]),
    };
  }

  static fromRule(rule: Pick<BlockRule, 'pattern'>, options?: IdentityOptions): SiteIdentityModel {
    const { host, path } = RulesService.splitPattern(rule.pattern);
    return this.fromHostAndPath(host || null, path, options);
  }

  static fromUrl(targetUrl: string | null | undefined, options?: IdentityOptions): SiteIdentityModel {
    if (!targetUrl) {
      return {
        host: null,
        path: '',
        label: 'Unknown site',
        faviconSources: this.dedupe([options?.preferredFaviconUrl]),
      };
    }

    const parsed = this.parseDisplayUrl(targetUrl);
    if (!parsed) {
      return {
        host: null,
        path: '',
        label: targetUrl,
        faviconSources: this.dedupe([options?.preferredFaviconUrl]),
      };
    }

    return {
      host: parsed.host,
      path: parsed.path,
      label: `${parsed.host}${parsed.path}`,
      faviconSources: this.dedupe([
        options?.preferredFaviconUrl,
        this.buildChromeFaviconSrc(parsed.faviconPageUrl),
        this.buildGoogleFaviconSrc(parsed.providerHost),
        this.buildDirectFaviconSrc(parsed.faviconPageUrl),
      ]),
    };
  }
}
