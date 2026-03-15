import type { SafeParseReturnType, ZodIssue } from 'zod';

import type { BlockRule, Settings, StorageSchema } from '../types/schema';
import { blockRuleSchema, blockRulesSchema, settingsSchema } from '../types/schema';
import { deepMerge } from '../utils/deepMerge';

import { createInitialSettings } from './defaultSettings';
import { RulesService } from './RulesService';

const SETTINGS_KEY: keyof StorageSchema = 'settings';
const RULES_KEY: keyof StorageSchema = 'rules';

export type StorageListener = (
  changes: { [p: string]: chrome.storage.StorageChange },
  areaName?: chrome.storage.AreaName,
) => void;

export type AddRuleResult = {
  ok: boolean;
  reason?: string;
  duplicateRules?: BlockRule[];
};

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

    const initialSettings = createInitialSettings();
    await chrome.storage.local.set({ [SETTINGS_KEY]: initialSettings });
    return initialSettings;
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
  static async addRule(newRule: BlockRule): Promise<AddRuleResult> {
    const currentRules: BlockRule[] = await this.getRules();
    const validated = blockRuleSchema.parse(newRule);

    const duplicateRules = await RulesService.findDuplicateRules(validated, currentRules);

    if (duplicateRules.length > 0) {
      return {
        ok: false,
        reason: 'Duplicate rule(s) exist',
        duplicateRules,
      };
    }

    await chrome.storage.local.set({
      [RULES_KEY]: [...currentRules, validated],
    });

    return { ok: true };
  }

  private static async setRules(newRules: BlockRule[]): Promise<void> {
    await chrome.storage.local.set({ [RULES_KEY]: newRules });
  }

  static async updateRule(ruleId: string, updates: Partial<BlockRule>): Promise<BlockRule | null> {
    const currentRules: BlockRule[] = await this.getRules();
    let updatedRule: BlockRule | null = null;

    const findAndMergeRule = (rule: BlockRule) => {
      if (rule.id !== ruleId) {
        return rule;
      }
      const merged = blockRuleSchema.parse({
        ...rule,
        ...updates,
      });

      console.log('successfully merged', merged);

      updatedRule = merged;
      return merged;
    };

    const newRules = currentRules.map(findAndMergeRule);

    if (!updatedRule) {
      return null;
    }

    await this.setRules(newRules);
    return updatedRule;
  }

  static async removeRule(ruleId: string): Promise<void> {
    const currentRules: BlockRule[] = await this.getRules();

    const ruleDoesNotHaveId = ({ id }: { id: string }) => id !== ruleId;

    const newRules: BlockRule[] = [...currentRules.filter(ruleDoesNotHaveId)];

    await this.setRules(newRules);
  }

  static addListener(listener: StorageListener): void {
    chrome.storage.onChanged.addListener(listener);
  }

  static removeListener(listener: StorageListener): void {
    chrome.storage.onChanged.removeListener(listener);
  }
}
