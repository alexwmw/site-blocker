import type { UnblockResponse } from '../../types/messages';
import type { BlockRule, Settings } from '../../types/schema';
import { StorageService } from '../StorageService';

import type { BlockingStrategy, SyncItems } from './strategies/BlockingStrategy';
import TabRedirectStrategy from './strategies/TabRedirectStrategy';

export default class BlockingEngine implements BlockingStrategy {
  private activeStrategy: BlockingStrategy;

  private tabRedirectStrategy: TabRedirectStrategy = new TabRedirectStrategy();

  constructor() {
    this.activeStrategy = this.tabRedirectStrategy;
  }

  private pickStrategyFromPermissions(_permissions?: chrome.runtime.ManifestPermission[]): BlockingStrategy {
    // search permissions if required
    return this.tabRedirectStrategy;
  }

  private handlePermissionChange = () => {
    (async () => {
      const { permissions } = await chrome.permissions.getAll();
      const prev = this.activeStrategy;
      const next = this.pickStrategyFromPermissions(permissions);
      const rules: BlockRule[] = await StorageService.getRules();
      const settings: Settings = await StorageService.getSettings();
      if (prev === next) {
        await this.activeStrategy.sync({ rules, settings });
        return;
      }
      await prev.stop();
      this.activeStrategy = next;
      await this.activeStrategy.start();
      await this.activeStrategy.sync({ rules, settings });
    })().catch(console.error);
  };

  private logMatchedRuleInfo = (info: chrome.declarativeNetRequest.MatchedRuleInfoDebug) => console.log(info);

  private started: boolean = false;

  /**
   * load rules/settings
   * detect permission mode
   * choose strategy
   * activeStrategy.start()
   * activeStrategy.sync(rules, settings)
   * register permission listeners
   */
  async start() {
    if (this.started) {
      return;
    }
    this.started = true;
    const rules = await StorageService.getRules();
    const settings = await StorageService.getSettings();

    const { permissions } = await chrome.permissions.getAll();

    // Start debugging
    if (typeof chrome.declarativeNetRequest !== 'undefined' && chrome.declarativeNetRequest.onRuleMatchedDebug) {
      chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(this.logMatchedRuleInfo);
    }

    this.activeStrategy = this.pickStrategyFromPermissions(permissions);

    await this.activeStrategy.start();
    await this.activeStrategy.sync({ rules, settings });
    chrome.permissions.onAdded.addListener(this.handlePermissionChange);

    chrome.permissions.onRemoved.addListener(this.handlePermissionChange);
  }

  /**
   * unregister permission listeners
   * activeStrategy.stop()
   */
  async stop() {
    if (!this.started) {
      return;
    }
    chrome.permissions.onAdded.removeListener(this.handlePermissionChange);
    chrome.permissions.onRemoved.removeListener(this.handlePermissionChange);

    if (typeof chrome.declarativeNetRequest !== 'undefined' && chrome.declarativeNetRequest.onRuleMatchedDebug) {
      chrome.declarativeNetRequest.onRuleMatchedDebug.removeListener(this.logMatchedRuleInfo);
    }

    await this.activeStrategy.stop();
    this.started = false;
  }

  async sync(items: SyncItems): Promise<void> {
    await this.activeStrategy.sync(items);
  }

  async handleUnblock(ruleIds: string[], targetUrl: string, senderTabId?: number): Promise<UnblockResponse> {
    return await this.activeStrategy.handleUnblock(ruleIds, targetUrl, senderTabId);
  }
}
