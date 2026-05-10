import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createEvent } from '@/services/blocking/test-utils';

describe('background entry', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('boots listeners and delegates startup wiring to the right services', async () => {
    const alarmListener = createEvent<[chrome.alarms.Alarm]>();
    const startupListener = createEvent<[]>();
    const installedListener = createEvent<[chrome.runtime.InstalledDetails]>();
    const storageListener = vi.fn();

    const initIcons = vi.fn(async () => {});
    const updateIcon = vi.fn();
    const scheduleNextIconUpdate = vi.fn(async () => {});
    const migrate = vi.fn(async () => {});
    const createContextMenu = vi.fn(async () => ({ ok: true }));
    const startStorageListening = vi.fn();
    const addStorageListener = vi.fn((listener) => storageListener.mockImplementation(listener));
    const startMessagesListening = vi.fn();
    const engineStart = vi.fn(async () => {});

    vi.doMock('@/services/IconsService', () => ({
      IconsService: {
        initIcons,
        updateIcon,
        scheduleNextIconUpdate,
      },
    }));
    vi.doMock('@/services/MigrationService', () => ({
      MigrationService: { migrate },
    }));
    vi.doMock('@/services/ContextMenuService', () => ({
      ContextMenuService: { createContextMenu },
    }));
    vi.doMock('@/services/StorageService', () => ({
      StorageService: {
        addListener: addStorageListener,
        startListening: startStorageListening,
      },
    }));
    vi.doMock('@/services/MessagesService', () => ({
      MessagesService: { startListening: startMessagesListening },
    }));
    vi.doMock('@/services/blocking/BlockingEngine', () => ({
      default: vi.fn(function BlockingEngine() {
        return {
          start: engineStart,
        };
      }),
    }));

    vi.stubGlobal('chrome', {
      alarms: {
        onAlarm: alarmListener,
      },
      runtime: {
        onStartup: startupListener,
        onInstalled: installedListener,
        getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
      },
      tabs: {
        create: vi.fn(async () => {}),
      },
    });

    await import('./index');

    expect(createContextMenu).toHaveBeenCalledTimes(1);
    expect(startStorageListening).toHaveBeenCalledTimes(1);
    expect(startMessagesListening).toHaveBeenCalledTimes(1);
    expect(engineStart).toHaveBeenCalledTimes(1);
    expect(chrome.runtime.onStartup.addListener).toHaveBeenCalledTimes(2);
    expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalledTimes(2);

    alarmListener.emit({ name: 'updateIcon', scheduledTime: Date.now() });
    startupListener.emit();

    expect(initIcons).toHaveBeenCalledTimes(2);

    storageListener({
      settings: {
        newValue: {
          theme: 'focus-dark',
          holdDurationSeconds: 10,
          isRated: false,
          blockPageHeadline: 'Stay on track',
          schedule: { enabled: false, windows: [] },
          extendedUnblock: { enabled: true, durationMinutes: 10 },
        },
      },
    });

    expect(updateIcon).toHaveBeenCalledWith({ enabled: false, windows: [] });
    expect(scheduleNextIconUpdate).toHaveBeenCalledWith({ enabled: false, windows: [] });
  });

  it('runs migration on install/update and only opens onboarding for first install', async () => {
    const alarmListener = createEvent<[chrome.alarms.Alarm]>();
    const startupListener = createEvent<[]>();
    const installedListener = createEvent<[chrome.runtime.InstalledDetails]>();

    const tabsCreate = vi.fn(async () => {});
    const migrate = vi.fn(async () => {});

    vi.doMock('@/services/IconsService', () => ({
      IconsService: {
        initIcons: vi.fn(async () => {}),
        updateIcon: vi.fn(),
        scheduleNextIconUpdate: vi.fn(async () => {}),
      },
    }));
    vi.doMock('@/services/MigrationService', () => ({
      MigrationService: { migrate },
    }));
    vi.doMock('@/services/ContextMenuService', () => ({
      ContextMenuService: { createContextMenu: vi.fn(async () => ({ ok: true })) },
    }));
    vi.doMock('@/services/StorageService', () => ({
      StorageService: {
        addListener: vi.fn(),
        startListening: vi.fn(),
      },
    }));
    vi.doMock('@/services/MessagesService', () => ({
      MessagesService: { startListening: vi.fn() },
    }));
    vi.doMock('@/services/blocking/BlockingEngine', () => ({
      default: vi.fn(function BlockingEngine() {
        return {
          start: vi.fn(async () => {}),
        };
      }),
    }));

    vi.stubGlobal('chrome', {
      alarms: {
        onAlarm: alarmListener,
      },
      runtime: {
        onStartup: startupListener,
        onInstalled: installedListener,
        getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
      },
      tabs: {
        create: tabsCreate,
      },
    });

    await import('./index');

    installedListener.emit({ reason: 'update' } as chrome.runtime.InstalledDetails);
    installedListener.emit({ reason: 'install' } as chrome.runtime.InstalledDetails);

    expect(migrate).toHaveBeenCalledTimes(2);
    expect(tabsCreate).toHaveBeenCalledTimes(1);
    expect(tabsCreate).toHaveBeenCalledWith({ url: 'chrome-extension://test/options.html?showOnboarding=true' });
  });
});
