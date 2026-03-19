import { useCallback, useEffect, useState } from 'react';

import type { StorageListener } from '@/services/StorageService';
import { StorageService } from '@/services/StorageService';
import type { Settings } from '@/types/schema';

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

  return {
    settings,
    updateSettings,
    isLoading: settings === null,
  };
};

export default useSettings;
