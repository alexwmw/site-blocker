import { describe, expect, it, vi } from 'vitest';

import { SiteIdentityService } from './SiteIdentityService';

const chromeMock = {
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://test${path}`),
  },
};

vi.stubGlobal('chrome', chromeMock);

describe('SiteIdentityService', () => {
  it('derives host and path from a rule using the canonical split pattern', () => {
    const identity = SiteIdentityService.fromRule({ pattern: 'https://www.Reddit.com/r/typescript/?sort=top' });

    expect(identity.host).toBe('reddit.com');
    expect(identity.path).toBe('/r/typescript');
    expect(identity.label).toBe('reddit.com/r/typescript');
    expect(identity.faviconSrc).toContain('pageUrl=https%3A%2F%2Freddit.com%2F');
  });

  it('keeps the page path for page-level identities created from urls', () => {
    const identity = SiteIdentityService.fromUrl('https://www.reddit.com/r/typescript/?sort=top', {
      faviconMode: 'page',
    });

    expect(identity.host).toBe('reddit.com');
    expect(identity.path).toBe('/r/typescript');
    expect(identity.faviconSrc).toContain('pageUrl=https%3A%2F%2Freddit.com%2Fr%2Ftypescript');
  });

  it('returns a fallback identity for unsupported urls', () => {
    const identity = SiteIdentityService.fromUrl('chrome://extensions');

    expect(identity.host).toBeNull();
    expect(identity.path).toBe('');
    expect(identity.label).toBe('chrome://extensions');
    expect(identity.faviconSrc).toBeNull();
  });
});
