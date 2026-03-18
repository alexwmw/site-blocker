import { useEffect, useMemo, useState } from 'react';

import type { StorageListener } from '@/services/StorageService';
import { StorageService } from '@/services/StorageService';
import type { ScheduleWindow, Settings } from '@/types/schema';
import { createUniqueId } from '@/utils/createUniqueId';

const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    // Initial load
    StorageService.getSettings().then(setSettings).catch(console.error);

    // Listen for Storage Changes
    const listener: StorageListener = (changes) => {
      // If the 'settings' key was updated anywhere in the extension...
      if (changes.settings) {
        setSettings(changes.settings.newValue as Settings);
      }
    };

    StorageService.addListener(listener);

    // Clean up the listener when the component unmounts
    return () => StorageService.removeListener(listener);
  }, []);

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
    updateSettings,
    isSchedulingEnabled,
    addScheduleWindow,
    removeScheduleWindow,
    updateScheduleWindow,
    isLoading: settings === null,
  };
};

export default useSettings;
