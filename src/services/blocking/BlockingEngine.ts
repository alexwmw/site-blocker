import type { BlockRule, Settings } from '../../types/schema';
import { StorageService } from '../StorageService';

import type { BlockingStrategy, UnblockResult } from './strategies/BlockingStrategy';
import DnrStrategy from './strategies/DnrStrategy';
import TabRedirectStrategy from './strategies/TabRedirectStrategy';

export default class BlockingEngine implements BlockingStrategy {
  private activeStrategy: BlockingStrategy;

  private tabRedirectStrategy: TabRedirectStrategy = new TabRedirectStrategy();

  private dnrStrategy: DnrStrategy = new DnrStrategy();

  constructor() {
    this.activeStrategy = this.tabRedirectStrategy;
  }

  private pickStrategyFromPermissions(permissions?: chrome.runtime.ManifestPermission[]): BlockingStrategy {
    return permissions?.includes('declarativeNetRequest') ? this.dnrStrategy : this.tabRedirectStrategy;
  }

  private handlePermissionChange(permissions: chrome.permissions.Permissions) {
    (async () => {
      const prev = this.activeStrategy;
      const next = this.pickStrategyFromPermissions(permissions.permissions);
      const rules: BlockRule[] = await StorageService.getRules();
      const settings: Settings = await StorageService.getSettings();
      if (prev === next) {
        await this.activeStrategy.sync(rules, settings);
        return;
      }
      await prev.stop();
      this.activeStrategy = next;
      await this.activeStrategy.start();
      await this.activeStrategy.sync(rules, settings);
    })().catch(console.error);
  }

  /**
   * load rules/settings
   * detect permission mode
   * choose strategy
   * activeStrategy.start()
   * activeStrategy.sync(rules, settings)
   * register permission listeners
   */
  async start() {
    const rules = await StorageService.getRules();
    const settings = await StorageService.getSettings();

    const { permissions } = await chrome.permissions.getAll();
    this.activeStrategy = this.pickStrategyFromPermissions(permissions);

    await this.activeStrategy.start();
    await this.activeStrategy.sync(rules, settings);
    chrome.permissions.onAdded.addListener(this.handlePermissionChange);

    chrome.permissions.onRemoved.addListener(this.handlePermissionChange);
  }

  /**
   * unregister permission listeners
   * activeStrategy.stop()
   */
  async stop() {
    chrome.permissions.onAdded.removeListener(this.handlePermissionChange);
    chrome.permissions.onRemoved.removeListener(this.handlePermissionChange);
    await this.activeStrategy.stop();
  }

  async sync(rules: BlockRule[], settings: Settings): Promise<void> {
    await this.activeStrategy.sync(rules, settings);
  }

  async handleUnblock(ruleId: string, targetUrl: string, senderTabId?: number): Promise<UnblockResult> {
    return await this.activeStrategy.handleUnblock(ruleId, targetUrl, senderTabId);
  }
}
