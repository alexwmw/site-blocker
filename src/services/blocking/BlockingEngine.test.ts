import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import defaultSettings from '../defaultSettings';
import { StorageService } from '../StorageService';

import BlockingEngine from './BlockingEngine';
import DnrStrategy from './strategies/archived/DnrStrategy';
import type { SyncItems } from './strategies/BlockingStrategy';
import TabRedirectStrategy from './strategies/TabRedirectStrategy';
import type { Listener } from './test-utils';
import { createEvent } from './test-utils';

import type { UnblockResponse } from '@/types/messages';
import type { BlockRule } from '@/types/schema';

const rules: BlockRule[] = [
  {
    id: 'rule-1',
    pattern: 'reddit.com',
    matchType: 'prefix',
    createdAt: '2026-01-01T00:00:00.000Z',
    enabled: true,
  },
];

describe('BlockingEngine', () => {
  let onAdded: {
    addListener: Mock<
      (listener: Listener<[chrome.permissions.Permissions]>) => Set<Listener<[chrome.permissions.Permissions]>>
    >;
    emit: (args_0: chrome.permissions.Permissions) => void;
    removeListener: unknown;
  };
  let onRemoved: {
    addListener: Mock<
      (listener: Listener<[chrome.permissions.Permissions]>) => Set<Listener<[chrome.permissions.Permissions]>>
    >;
    removeListener: unknown;
    emit?: (args_0: chrome.permissions.Permissions) => void;
  };
  let getAll: Mock<() => Promise<chrome.permissions.Permissions>>;
  let tabStart: Mock<() => Promise<void>>;
  let tabStop: Mock<() => Promise<void>>;
  let tabSync: Mock<(items: SyncItems) => Promise<void>>;
  let tabHandleUnblock: Mock<(ruleId: string[], targetUrl: string, senderTabId?: number) => Promise<UnblockResponse>>;
  let dnrStart: Mock<() => Promise<void>>;
  let dnrStop: Mock<() => Promise<void>>;
  let dnrSync: Mock<(items: SyncItems) => Promise<void>>;
  let dnrHandleUnblock: Mock<(ruleId: string[], targetUrl: string, senderTabId?: number) => Promise<UnblockResponse>>;

  const onAddedFactory = () => createEvent<[chrome.permissions.Permissions]>();
  const onRemovedFactory = () => createEvent<[chrome.permissions.Permissions]>();

  const getAllFactory = () => vi.fn<() => Promise<chrome.permissions.Permissions>>();

  const tabStartFactory = () => vi.spyOn(TabRedirectStrategy.prototype, 'start').mockResolvedValue();
  const tabStopFactory = () => vi.spyOn(TabRedirectStrategy.prototype, 'stop').mockResolvedValue();
  const tabSyncFactory = () => vi.spyOn(TabRedirectStrategy.prototype, 'sync').mockResolvedValue();
  const tabHandleUnblockFactory = () =>
    vi.spyOn(TabRedirectStrategy.prototype, 'handleUnblock').mockResolvedValue({ ok: true, reason: 'tab' });

  const dnrStartFactory = () => vi.spyOn(DnrStrategy.prototype, 'start').mockResolvedValue();
  const dnrStopFactory = () => vi.spyOn(DnrStrategy.prototype, 'stop').mockResolvedValue();
  const dnrSyncFactory = () => vi.spyOn(DnrStrategy.prototype, 'sync').mockResolvedValue();
  const dnrHandleUnblockFactory = () =>
    vi.spyOn(DnrStrategy.prototype, 'handleUnblock').mockResolvedValue({ ok: true, reason: 'dnr' });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(StorageService, 'getRules').mockResolvedValue(rules);
    vi.spyOn(StorageService, 'getSettings').mockResolvedValue(defaultSettings);

    onAdded = onAddedFactory();
    onRemoved = onRemovedFactory();
    getAll = getAllFactory();
    tabStart = tabStartFactory();
    tabStop = tabStopFactory();
    tabSync = tabSyncFactory();
    tabHandleUnblock = tabHandleUnblockFactory();
    dnrStart = dnrStartFactory();
    dnrStop = dnrStopFactory();
    dnrSync = dnrSyncFactory();
    dnrHandleUnblock = dnrHandleUnblockFactory();

    vi.stubGlobal('chrome', {
      permissions: {
        getAll,
        onAdded,
        onRemoved,
      },
    });
  });

  it('starts tab redirect strategy when declarativeNetRequest permission is absent', async () => {
    getAll.mockResolvedValue({ permissions: ['storage'] });
    const engine = new BlockingEngine();

    await engine.start();

    expect(tabStart).toHaveBeenCalledTimes(1);
    expect(tabSync).toHaveBeenCalledWith({ rules, settings: defaultSettings });
    expect(dnrStart).not.toHaveBeenCalled();
    expect(onAdded.addListener).toHaveBeenCalledTimes(1);
    expect(onRemoved.addListener).toHaveBeenCalledTimes(1);
  });

  // archived strategy - no strategy to switch to
  it.fails('starts dnr strategy when declarativeNetRequest permission is present', async () => {
    getAll.mockResolvedValue({ permissions: ['declarativeNetRequest'] });
    const engine = new BlockingEngine();

    await engine.start();

    expect(dnrStart).toHaveBeenCalledTimes(1);
    expect(dnrSync).toHaveBeenCalledWith({ rules, settings: defaultSettings });
    expect(tabStart).not.toHaveBeenCalled();
  });

  // archived strategy - no strategy to switch to
  it.fails('switches strategies on permission changes', async () => {
    getAll.mockResolvedValue({ permissions: ['storage'] });

    const engine = new BlockingEngine();

    await engine.start();
    getAll.mockResolvedValue({ permissions: ['storage', 'declarativeNetRequest'] });
    onAdded.emit({ permissions: ['declarativeNetRequest'] });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(tabStop).toHaveBeenCalledTimes(1);
    expect(dnrStart).toHaveBeenCalledTimes(1);
    expect(dnrSync).toHaveBeenCalledWith({ rules, settings: defaultSettings });
  });

  // archived strategy - no strategy to switch to
  it.fails('stop unregisters permission listeners and stops active strategy', async () => {
    getAll.mockResolvedValue({ permissions: ['declarativeNetRequest'] });
    const engine = new BlockingEngine();

    await engine.start();
    await engine.stop();

    expect(onAdded.removeListener).toHaveBeenCalledTimes(1);
    expect(onRemoved.removeListener).toHaveBeenCalledTimes(1);
    expect(dnrStop).toHaveBeenCalledTimes(1);
  });

  it('sync and handleUnblock delegate to active strategy', async () => {
    getAll.mockResolvedValue({ permissions: ['declarativeNetRequest'] }); // dnr strategy is archived

    const engine = new BlockingEngine();

    await engine.start();
    await engine.sync({ rules, settings: defaultSettings });
    const result = await engine.handleUnblock(['rule-1'], 'https://reddit.com', 10);

    expect(tabSync).toHaveBeenCalledWith({ rules, settings: defaultSettings });
    expect(tabHandleUnblock).toHaveBeenCalledWith(['rule-1'], 'https://reddit.com', 10);
    expect(dnrSync).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, reason: 'tab' });
  });
});
