export function getBlockPageUrl() {
  return `chrome-extension://${chrome.runtime.id}/block-page.html`;
}

export function getOptionsPageUrl() {
  return `chrome-extension://${chrome.runtime.id}/options.html`;
}

export function isExtensionUrl(url: string | null): boolean {
  return Boolean(url && url.startsWith(`chrome-extension://${chrome.runtime.id}`));
}

export type WebStorePage = 'reviews' | 'support';

export function getChromeWebStoreUrl(page?: WebStorePage) {
  const baseUrl = `https://chromewebstore.google.com/detail/${chrome.runtime.id}`;

  if (page) {
    return `${baseUrl}/${page}`;
  }
  return baseUrl;
}

export function getAllowIncognitoUrl() {
  return `chrome://extensions/?id=${chrome.runtime.id}#:~:text=Allow%20in%20Incognito`;
}

export function getPinToToolbarUrl() {
  return `chrome://extensions/?id=${chrome.runtime.id}#:~:text=Pin%20to%20toolbar`;
}
export function getRemoveExtensionUrl() {
  return `chrome://extensions/?id=${chrome.runtime.id}#:~:text=Remove%20extension`;
}
