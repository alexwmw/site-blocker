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

export class SiteIdentityService {
  private static dedupe(values: Array<string | null | undefined>): string[] {
    return [...new Set(values.filter((value): value is string => Boolean(value)))];
  }

  private static buildGoogleFaviconSrc(host: string | null): string | null {
    if (!host) {
      return null;
    }

    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
  }

  private static buildDirectFaviconSrc(host: string | null): string | null {
    if (!host) {
      return null;
    }

    return `https://${host}/favicon.ico`;
  }

  static fromHostAndPath(
    host: string | null,
    path: string | null | undefined,
    options?: IdentityOptions,
  ): SiteIdentityModel {
    const safePath = path && path !== '/' ? path : '';
    const label = host ? `${host}${safePath}` : 'Unknown site';

    return {
      host,
      path: safePath,
      label,
      faviconSources: this.dedupe([
        options?.preferredFaviconUrl,
        this.buildGoogleFaviconSrc(host),
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
