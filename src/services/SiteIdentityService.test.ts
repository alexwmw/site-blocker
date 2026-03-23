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
    expect(identity.faviconSources).toEqual([
      'chrome-extension://test/_favicon/?pageUrl=https%3A%2F%2Freddit.com%2Fr%2Ftypescript&size=64',
      'https://www.google.com/s2/favicons?domain=reddit.com&sz=64',
      'https://reddit.com/favicon.ico',
    ]);
  });

  it('preserves protocol, port, and path casing when deriving from a live url', () => {
    const identity = SiteIdentityService.fromUrl('http://localhost:3000/Docs?sort=top#intro', {
      preferredFaviconUrl: 'https://cdn.example.com/favicon.png',
    });

    expect(identity.host).toBe('localhost:3000');
    expect(identity.path).toBe('/Docs');
    expect(identity.label).toBe('localhost:3000/Docs');
    expect(identity.faviconSources).toEqual([
      'https://cdn.example.com/favicon.png',
      'chrome-extension://test/_favicon/?pageUrl=http%3A%2F%2Flocalhost%3A3000%2FDocs%3Fsort%3Dtop%23intro&size=64',
      'https://www.google.com/s2/favicons?domain=localhost&sz=64',
      'http://localhost:3000/favicon.ico',
    ]);
  });

  it('returns a fallback identity for unsupported urls', () => {
    const identity = SiteIdentityService.fromUrl('chrome://extensions');

    expect(identity.host).toBeNull();
    expect(identity.path).toBe('');
    expect(identity.label).toBe('chrome://extensions');
    expect(identity.faviconSources).toEqual([]);
  });
});
