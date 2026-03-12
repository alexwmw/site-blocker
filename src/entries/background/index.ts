import BlockingEngine from '../../services/blocking/BlockingEngine';
import type { SyncItems } from '../../services/blocking/strategies/BlockingStrategy';
import { MigrationService } from '../../services/MigrationService';
import { StorageService } from '../../services/StorageService';
import { blockRulesSchema, settingsSchema } from '../../types/schema';

const blockingEngine = new BlockingEngine();

/** Migration and other install tasks **/

chrome.runtime.onInstalled.addListener((details) => {
  (async (details) => {
    console.log('Extension installed/updated. Reason:', details.reason);

    await MigrationService.migrate();
    console.log('Migration finished.');
    const settings = await StorageService.getSettings();
    const blockRules = await StorageService.getRules();

    console.log('Settings are:', settings);
    console.log('Block rules are:', blockRules);
  })(details).catch(console.error);
});

async function startTheEngine() {
  StorageService.addListener((changes) => {
    const items: SyncItems = {};
    if ('settings' in changes) {
      items.settings = settingsSchema.parse(changes.settings.newValue);
    }
    if ('rules' in changes) {
      items.rules = blockRulesSchema.parse(changes.rules.newValue);
    }
    blockingEngine.sync(items).catch(console.error);
  });

  await blockingEngine.start();
}

startTheEngine().catch(console.error);
