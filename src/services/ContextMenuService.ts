import CreateProperties = chrome.contextMenus.CreateProperties;
import Tab = chrome.tabs.Tab;
import OnClickData = chrome.contextMenus.OnClickData;
import type BlockingEngine from '@/services/blocking/BlockingEngine';
import { RulesService } from '@/services/RulesService';
import { StorageService } from '@/services/StorageService';

export class ContextMenuService {
  private static MENU_ID = 'contextMenu';

  private static blockingEngine: BlockingEngine | null = null;

  private static menuItems: (CreateProperties & {
    handler: (info: OnClickData, tab: Tab & { url: string }) => void;
  })[] = [
    {
      id: 'addDomainToBlockList',
      parentId: this.MENU_ID,
      title: 'Block this site',
      visible: true,
      handler: (_info, tab) => {
        const rule = RulesService.createUrlRule(tab.url, 'prefix', 'domain');
        if (rule) {
          StorageService.addRule(rule).catch(console.error);
        }
      },
    },
    {
      id: 'addPageToBlockList',
      parentId: this.MENU_ID,
      title: 'Block this specific page',
      visible: true,
      handler: (_info, tab) => {
        const rule = RulesService.createUrlRule(tab.url, 'prefix', 'path');
        if (rule) {
          StorageService.addRule(rule).catch(console.error);
        }
      },
    },
    {
      id: 'manageBlockList',
      parentId: this.MENU_ID,
      title: 'Manage blocked items',
      visible: true,
      handler: (_info, _tab) => {
        chrome.runtime.openOptionsPage().catch(console.error);
      },
    },
  ];

  private static handlerMap = Object.fromEntries(this.menuItems.map(({ id, handler }) => [id, handler])) as Record<
    string,
    (info: OnClickData, tab: Tab) => void
  >;

  private static rootMenu: CreateProperties = {
    id: this.MENU_ID,
    title: 'Hold - Mindful Website Blocking',
    documentUrlPatterns: ['https://*/*', 'http://*/*'],
  };

  private static listener = (info: OnClickData, tab?: Tab) => {
    if (!tab || !tab.url) {
      return;
    }
    if (this.blockingEngine === null) {
      return;
    }
    const action = this.handlerMap[info.menuItemId];
    if (action) {
      action(info, tab);
    }
  };

  static async createContextMenu(blockingEngine: BlockingEngine): Promise<{ ok: boolean; reason?: unknown }> {
    if (this.blockingEngine !== null) {
      return { ok: false, reason: 'Already created.' };
    }
    this.blockingEngine = blockingEngine;
    try {
      await chrome.contextMenus.removeAll();
      chrome.contextMenus.onClicked.addListener(this.listener);

      chrome.contextMenus.create(this.rootMenu);

      for (const menuItem of this.menuItems) {
        const { handler, ...createProps } = menuItem;
        chrome.contextMenus.create(createProps);
      }

      return { ok: true };
    } catch (e) {
      this.removeContextMenu().catch(console.error);
      return { ok: false, reason: e };
    }
  }

  static async removeContextMenu() {
    if (this.blockingEngine === null) {
      return;
    }
    this.blockingEngine = null;
    chrome.contextMenus.onClicked.removeListener(this.listener);
    await chrome.contextMenus.remove(this.MENU_ID);
  }
}
