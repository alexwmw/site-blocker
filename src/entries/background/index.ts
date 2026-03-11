import BlockingEngine from '../../services/blocking/BlockingEngine';
import { MigrationService } from '../../services/MigrationService';
import { StorageService } from '../../services/StorageService';

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
  const rules = await StorageService.getRules();
  const settings = await StorageService.getSettings();
  StorageService.addListener((changes) => {
    if ('rules' in changes || 'settings' in changes) {
      blockingEngine.sync(rules, settings).catch(console.error);
    }
  });
  await blockingEngine.sync(rules, settings);
  await blockingEngine.start();
}

startTheEngine().catch(console.error);
