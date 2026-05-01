import BlockingEngine from '@/services/blocking/BlockingEngine';
import { ContextMenuService } from '@/services/ContextMenuService';
import { IconsService } from '@/services/IconsService';
import { MessagesService } from '@/services/MessagesService';
import { MigrationService } from '@/services/MigrationService';
import { StorageService } from '@/services/StorageService';
import { settingsSchema } from '@/types/schema';

const blockingEngine = new BlockingEngine();

/* ---------------------------------------------
 * ICONS
 * -------------------------------------------- */

const initIcons = () => {
  IconsService.initIcons().catch(console.error);
};

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'updateIcon') {
    return;
  }
  initIcons();
});

StorageService.addListener((changes) => {
  if ('settings' in changes) {
    const { schedule: newSchedule } = settingsSchema.parse(changes.settings.newValue);
    IconsService.updateIcon(newSchedule);
    IconsService.scheduleNextIconUpdate(newSchedule).catch(console.error);
  }
});

chrome.runtime.onStartup.addListener(initIcons);
chrome.runtime.onInstalled.addListener(initIcons);

/* ---------------------------------------------
 * MIGRATION (INSTALL ONLY)
 * -------------------------------------------- */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Installed/updated:', details.reason);
  MigrationService.migrate().catch(console.error);

  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') }).catch(console.error);
  }
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
