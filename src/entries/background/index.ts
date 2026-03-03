import { MigrationService } from '../../services/MigrationService';
import { StorageService } from '../../services/StorageService';

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
