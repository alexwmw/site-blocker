import { useCallback, useEffect, useState } from 'react';

import { MessagesService } from '@/services/MessagesService';
import type { Settings } from '@/types/schema';

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)));

const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const response = await MessagesService.sendMessage({ type: 'GET_SETTINGS_REQUEST' });
      if (!response.ok) {
        throw new Error(response.reason ?? 'Could not load settings');
      }
      setSettings(response.settings);
      setError(null);
    } catch (loadError) {
      console.error(loadError);
      setSettings(null);
      setError(toError(loadError));
    }
  }, []);

  useEffect(() => {
    loadSettings().catch(console.error);
  }, [loadSettings]);

  const updateSettings = async (updates: Partial<Settings>) => {
    const response = await MessagesService.sendMessage({ type: 'UPDATE_SETTINGS_REQUEST', payload: { updates } });
    if (!response.ok) throw new Error(response.reason ?? 'Could not update settings');
    await loadSettings();
  };

  return { settings, error, updateSettings };
};

export default useSettings;
