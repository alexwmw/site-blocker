import { SchedulingService } from '@/services/SchedulingService';
import { StorageService } from '@/services/StorageService';
import type { Schedule } from '@/types/schema';

export class IconsService {
  private static defaultIcons = {
    16: 'icons/icon64.png',
    32: 'icons/icon128.png',
    48: 'icons/icon256.png',
    128: 'icons/icon512.png',
  };

  private static disabledIcons = {
    16: 'icons/disabled/icon64.png',
    32: 'icons/disabled/icon128.png',
    48: 'icons/disabled/icon256.png',
    128: 'icons/disabled/icon512.png',
  };

  static updateIcon(schedule: Schedule) {
    const icons = SchedulingService.isBlockingActiveNow(schedule) ? this.defaultIcons : this.disabledIcons;
    chrome.action
      .setIcon({
        path: icons,
      })
      .catch(console.error);
  }

  static async scheduleNextIconUpdate(schedule: Schedule) {
    await chrome.alarms.clear('updateIcon');
    const nextTime = SchedulingService.getNextChangeTime(schedule);
    if (nextTime) {
      await chrome.alarms.create('updateIcon', {
        when: nextTime.getTime(),
      });
    }
  }
  static initIcons() {
    StorageService.getSettings()
      .then(async ({ schedule }) => {
        this.updateIcon(schedule);
        await this.scheduleNextIconUpdate(schedule);
      })
      .catch(console.error);
  }
}
