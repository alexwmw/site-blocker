import { useEffect, useState } from 'react';

import type { StorageListener } from '@/services/StorageService';
import { StorageService } from '@/services/StorageService';
import type { Settings } from '@/types/schema';

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

  return {
    settings,
    updateSettings,
    isLoading: settings === null,
  };
};

export default useSettings;
