import { useCallback, useEffect, useMemo, useState } from 'react';

import type { StorageListener } from '@/services/StorageService';
import { StorageService } from '@/services/StorageService';
import type { ScheduleWindow, Settings } from '@/types/schema';
import { createUniqueId } from '@/utils/createUniqueId';

const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const nextSettings = await StorageService.getSettings();
      setSettings(nextSettings);
    } catch (loadError) {
      console.error(loadError);
      setSettings(null);
    }
  }, []);

  useEffect(() => {
    loadSettings().catch(console.error);

    const listener: StorageListener = (changes) => {
      if (changes.settings) {
        setSettings(changes.settings.newValue as Settings);
      }
    };

    StorageService.addListener(listener);

    return () => StorageService.removeListener(listener);
  }, [loadSettings]);

  const updateSettings = async (updates: Partial<Settings>) => {
    await StorageService.updateSettings(updates);
  };

  const isSchedulingEnabled = useMemo(() => settings?.schedule.enabled, [settings]);

  const addScheduleWindow = async (window?: ScheduleWindow) => {
    const newWindow: ScheduleWindow = {
      id: createUniqueId(),
      days: [false, false, false, false, false, false, false],
      start: '09:00',
      end: '17:00',
    };
    await StorageService.addScheduleWindow(window ?? newWindow);
  };

  const removeScheduleWindow = async (id: string) => {
    await StorageService.removeScheduleWindow(id);
  };

  const updateScheduleWindow = async (id: string, updates: Partial<ScheduleWindow>) => {
    await StorageService.updateScheduleWindow(id, updates);
  };

  return {
    settings,
    retryLoad: loadSettings,
    updateSettings,
    isSchedulingEnabled,
    addScheduleWindow,
    removeScheduleWindow,
    updateScheduleWindow,
    isLoading: settings === null,
  };
};

export default useSettings;
