import BlockingEngine from '@/services/blocking/BlockingEngine';
import { ContextMenuService } from '@/services/ContextMenuService';
import { MessagesService } from '@/services/MessagesService';
import { MigrationService } from '@/services/MigrationService';
import { StorageService } from '@/services/StorageService';

const blockingEngine = new BlockingEngine();

/* ---------------------------------------------
 * MIGRATION (INSTALL ONLY)
 * -------------------------------------------- */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Installed/updated:', details.reason);

  MigrationService.migrate().catch(console.error);
});

/* ---------------------------------------------
 * CONTEXT MENUS (SAFE RE-CREATE)
 * -------------------------------------------- */
function initContextMenus() {
  ContextMenuService.createContextMenu(blockingEngine).catch(console.error);
}
chrome.runtime.onStartup.addListener(initContextMenus);
initContextMenus();

/* ---------------------------------------------
 * LISTENERS
 * -------------------------------------------- */
StorageService.startListening(blockingEngine);
MessagesService.startListening(blockingEngine);

/* ---------------------------------------------
 * ENGINE START
 * -------------------------------------------- */
blockingEngine.start().catch(console.error);
