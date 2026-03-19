import { useCallback, useEffect, useState } from 'react';

import type { StorageListener } from '@/services/StorageService';
import { StorageService } from '@/services/StorageService';
import type { Settings } from '@/types/schema';
import { settingsSchema } from '@/types/schema';

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)));

const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const nextSettings = await StorageService.getSettings();
      setSettings(nextSettings);
      setError(null);
    } catch (loadError) {
      console.error(loadError);
      setSettings(null);
      setError(toError(loadError));
    }
  }, []);

  useEffect(() => {
    loadSettings().catch(console.error);

    const listener: StorageListener = (changes) => {
      if (changes.settings) {
        const validated = settingsSchema.safeParse(changes.settings.newValue);

        if (!validated.success) {
          const changeError = validated.error;
          console.error(changeError);
          setSettings(null);
          setError(changeError);
          return;
        }

        setSettings(validated.data);
        setError(null);
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
    error,
    updateSettings,
  };
};

export default useSettings;
