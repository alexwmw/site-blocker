import type { SafeParseReturnType, ZodIssue } from 'zod';

import type { BlockRule, Settings, StorageSchema } from '../types/schema';
import { blockRuleSchema, blockRulesSchema, settingsSchema } from '../types/schema';
import { deepMerge } from '../types/schema-utils';

import defaultSettings from './defaultSettings';

const SETTINGS_KEY: keyof StorageSchema = 'settings';
const RULES_KEY: keyof StorageSchema = 'rules';

export class StorageService {
  static async getSettings(): Promise<Settings> {
    const result = await chrome.storage.local.get(SETTINGS_KEY);

    const data = result[SETTINGS_KEY];
    const validated = settingsSchema.safeParse(data);

    if (validated.success) {
      return validated.data;
    }

    if (data) {
      console.error('Zod Validation Failed for Rules:', validated.error.format());
    }

    return defaultSettings;
  }

  static async updateSettings(updates: Partial<Settings>): Promise<void> {
    const current: Settings = await this.getSettings();
    const merged: Settings = deepMerge(current, updates);
    const finalSettings: Settings = settingsSchema.parse(merged);

    await chrome.storage.local.set({ [SETTINGS_KEY]: finalSettings });
  }

  private static logError(validated: SafeParseReturnType<unknown, unknown>) {
    const mapIssues = (issue: ZodIssue) => {
      const path = issue.path.join('.');
      return `❌ [${path}]: ${issue.message}`;
    };
    if (validated.error) {
      console.error(validated.error.issues.map(mapIssues).join('\n'));
    }
  }

  static async getRules(): Promise<BlockRule[]> {
    const result = await chrome.storage.local.get(RULES_KEY);
    const data = result[RULES_KEY];
    const validated = blockRulesSchema.safeParse(data);

    if (validated.success) {
      return validated.data;
    }

    if (data) {
      this.logError(validated);
    }

    return [];
  }
  static async addRule(newRule: BlockRule): Promise<void> {
    const validated = blockRuleSchema.parse(newRule);

    const currentRules: BlockRule[] = await this.getRules();
    await chrome.storage.local.set({
      [RULES_KEY]: [...currentRules, validated],
    });
  }

  private static async setRules(newRules: BlockRule[]): Promise<void> {
    await chrome.storage.local.set({ [RULES_KEY]: newRules });
  }

  static async removeRule(ruleId: string): Promise<void> {
    const currentRules: BlockRule[] = await this.getRules();

    const ruleDoesNotHaveId = ({ id }: { id: string }) => id !== ruleId;

    const newRules: BlockRule[] = [...currentRules.filter(ruleDoesNotHaveId)];

    await this.setRules(newRules);
  }
}
