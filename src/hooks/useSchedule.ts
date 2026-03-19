import useSettings from '@/hooks/useSettings';
import { StorageService } from '@/services/StorageService';
import type { ScheduleWindow } from '@/types/schema';
import { createUniqueId } from '@/utils/createUniqueId';

export const createNewScheduleWindow: () => ScheduleWindow = () => ({
  id: createUniqueId(),
  days: [false, false, false, false, false, false, false],
  start: '09:00',
  end: '17:00',
});

const useSchedule = () => {
  const { settings, error, updateSettings } = useSettings();

  const setSchedulingEnabled = async (enabled: boolean) => {
    if (!settings) {
      return;
    }

    await updateSettings({
      schedule: {
        ...settings.schedule,
        enabled,
      },
    });
  };

  const addScheduleWindow = async (window?: ScheduleWindow) => {
    await StorageService.addScheduleWindow(window ?? createNewScheduleWindow());
  };

  const removeScheduleWindow = async (id: string) => {
    await StorageService.removeScheduleWindow(id);
  };

  const updateScheduleWindow = async (id: string, updates: Partial<ScheduleWindow>) => {
    await StorageService.updateScheduleWindow(id, updates);
  };

  return {
    schedule: settings?.schedule ?? null,
    error,
    setSchedulingEnabled,
    addScheduleWindow,
    removeScheduleWindow,
    updateScheduleWindow,
  };
};

export default useSchedule;
