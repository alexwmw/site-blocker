export const POPULAR_WEBSITES = [
  'youtube.com',
  'reddit.com',
  'x.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'linkedin.com',
  'netflix.com',
] as const;

export type PopularWebsite = (typeof POPULAR_WEBSITES)[number];
