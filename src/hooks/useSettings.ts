import { useEffect, useState } from 'react';

import { StorageService } from '../services/StorageService';
import type { Settings } from '../types/schema';

const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    // Initial load
    StorageService.getSettings().then(setSettings).catch(console.error);

    // Listen for Storage Changes
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      // If the 'settings' key was updated anywhere in the extension...
      if (changes.settings) {
        setSettings(changes.settings.newValue as Settings);
      }
    };

    chrome.storage.onChanged.addListener(listener);

    // Clean up the listener when the component unmounts
    return () => chrome.storage.onChanged.removeListener(listener);
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
