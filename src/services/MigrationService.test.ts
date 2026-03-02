import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MigrationService } from './MigrationService';
import LEGACY_DATA_1 from './test-data/example-legacy-data_1.json';

// Mock the Chrome API
const chromeMock = {
  storage: {
    sync: { get: vi.fn() },
    local: { set: vi.fn() },
  },
};
vi.stubGlobal('chrome', chromeMock);

describe('MigrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should correctly parse the legacy date format "DD/MM/YYYY, HH:mm:ss"', async () => {
    chromeMock.storage.sync.get.mockResolvedValue(LEGACY_DATA_1);
    await MigrationService.migrate();

    const savedData = chromeMock.storage.local.set.mock.calls[0][0];
    // Check if it converted correctly to ISO (Month is 0-indexed, so Feb is 01)
    expect(savedData.rules[0].createdAt).toBe('2025-02-16T22:15:14.000Z');
  });

  it('should handle "true" strings as actual booleans', async () => {
    const legacyData = {
      options: {
        allowRevisits: { value: 'true' },
        revisitLimit: { value: '45' },
      },
    };

    chromeMock.storage.sync.get.mockResolvedValue(legacyData);
    await MigrationService.migrate();

    const savedData = chromeMock.storage.local.set.mock.calls[0][0];
    expect(savedData.settings.revisit.enabled).toBe(true);
    expect(savedData.settings.revisit.durationMinutes).toBe(45);
  });

  it('should fallback to default settings if legacy data is missing', async () => {
    chromeMock.storage.sync.get.mockResolvedValue({ options: {} });
    await MigrationService.migrate();

    const savedData = chromeMock.storage.local.set.mock.calls[0][0];
    expect(savedData.settings.holdDurationSeconds).toBe(20); // The default
  });
});
