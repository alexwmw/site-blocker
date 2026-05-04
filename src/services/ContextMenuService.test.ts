import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type BlockingEngine from './blocking/BlockingEngine';
import { ContextMenuService } from './ContextMenuService';
import { RulesService } from './RulesService';
import { StorageService } from './StorageService';

import { createEvent } from '@/services/blocking/test-utils';
import type { BlockRule } from '@/types/schema';

const makeRule = (overrides: Partial<BlockRule> = {}): BlockRule => ({
  id: 'rule-1',
  pattern: 'example.com',
  matchType: 'prefix',
  createdAt: '2026-01-01T00:00:00.000Z',
  enabled: true,
  ...overrides,
});

describe('ContextMenuService', () => {
  const onClicked = createEvent<[chrome.contextMenus.OnClickData, chrome.tabs.Tab | undefined]>();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal('chrome', {
      contextMenus: {
        removeAll: vi.fn(async () => {}),
        create: vi.fn(),
        remove: vi.fn(async () => {}),
        onClicked,
      },
      runtime: {
        openOptionsPage: vi.fn(async () => {}),
      },
    });
  });

  afterEach(async () => {
    await ContextMenuService.removeContextMenu();
  });

  it('creates the root menu, child items, and click listener once', async () => {
    const result = await ContextMenuService.createContextMenu({} as BlockingEngine);

    expect(result).toEqual({ ok: true });
    expect(chrome.contextMenus.removeAll).toHaveBeenCalledTimes(1);
    expect(chrome.contextMenus.onClicked.addListener).toHaveBeenCalledTimes(1);
    expect(chrome.contextMenus.create).toHaveBeenCalledTimes(4);
    expect(chrome.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'contextMenu',
        title: 'Hold - Mindful Website Blocking',
      }),
    );
  });

  it('does not recreate the menu when it has already been created', async () => {
    await ContextMenuService.createContextMenu({} as BlockingEngine);

    const secondResult = await ContextMenuService.createContextMenu({} as BlockingEngine);

    expect(secondResult).toEqual({ ok: false, reason: 'Already created.' });
    expect(chrome.contextMenus.create).toHaveBeenCalledTimes(4);
  });

  it('adds a domain rule from the site action and a path rule from the page action', async () => {
    vi.spyOn(RulesService, 'createUrlRule')
      .mockReturnValueOnce(makeRule({ id: 'domain-rule' }))
      .mockReturnValueOnce(makeRule({ id: 'path-rule', pattern: 'example.com/page' }));
    const addRuleSpy = vi.spyOn(StorageService, 'addRule').mockResolvedValue({ ok: true });

    await ContextMenuService.createContextMenu({} as BlockingEngine);

    onClicked.emit(
      { menuItemId: 'addDomainToBlockList' } as chrome.contextMenus.OnClickData,
      {
        url: 'https://example.com/page',
      } as chrome.tabs.Tab,
    );
    onClicked.emit(
      { menuItemId: 'addPageToBlockList' } as chrome.contextMenus.OnClickData,
      {
        url: 'https://example.com/page',
      } as chrome.tabs.Tab,
    );

    expect(RulesService.createUrlRule).toHaveBeenNthCalledWith(1, 'https://example.com/page', 'prefix', 'domain');
    expect(RulesService.createUrlRule).toHaveBeenNthCalledWith(2, 'https://example.com/page', 'prefix', 'path');
    expect(addRuleSpy).toHaveBeenNthCalledWith(1, makeRule({ id: 'domain-rule' }));
    expect(addRuleSpy).toHaveBeenNthCalledWith(2, makeRule({ id: 'path-rule', pattern: 'example.com/page' }));
  });

  it('opens the options page from the manage action and ignores unsupported click payloads', async () => {
    await ContextMenuService.createContextMenu({} as BlockingEngine);

    onClicked.emit(
      { menuItemId: 'manageBlockList' } as chrome.contextMenus.OnClickData,
      {
        url: 'https://example.com/page',
      } as chrome.tabs.Tab,
    );
    onClicked.emit({ menuItemId: 'addDomainToBlockList' } as chrome.contextMenus.OnClickData, undefined);

    expect(chrome.runtime.openOptionsPage).toHaveBeenCalledTimes(1);
  });

  it('removes listeners and root menu on cleanup', async () => {
    await ContextMenuService.createContextMenu({} as BlockingEngine);

    await ContextMenuService.removeContextMenu();

    expect(chrome.contextMenus.onClicked.removeListener).toHaveBeenCalledTimes(1);
    expect(chrome.contextMenus.remove).toHaveBeenCalledWith('contextMenu');
  });

  it('tears itself down when creation fails', async () => {
    vi.mocked(chrome.contextMenus.removeAll).mockRejectedValueOnce(new Error('context menus unavailable'));

    const result = await ContextMenuService.createContextMenu({} as BlockingEngine);

    expect(result.ok).toBe(false);
    expect(chrome.contextMenus.onClicked.removeListener).toHaveBeenCalledTimes(1);
  });
});
