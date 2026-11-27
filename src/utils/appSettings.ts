import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../api/config';
import { getSessionAccessToken } from '../api/http';
import { syncBackgroundNotifications } from './localNotification';

export interface AppSettings {
  pushNotification: boolean;
  tripReminder: boolean;
  weatherNotification: boolean;
  locationEnabled: boolean;
}

export const SETTINGS_STORAGE_KEY = 'smarttravel.settings';
export const DEFAULT_APP_SETTINGS: AppSettings = {
  pushNotification: true,
  tripReminder: true,
  weatherNotification: true,
  locationEnabled: true,
};

let cached: AppSettings = { ...DEFAULT_APP_SETTINGS };

export function getCachedAppSettings(): AppSettings {
  return cached;
}

export async function loadAppSettings(): Promise<AppSettings> {
  try {
    const raw = await SecureStore.getItemAsync(SETTINGS_STORAGE_KEY);
    if (raw) {
      cached = { ...DEFAULT_APP_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
    }
  } catch {
    // Giữ giá trị mặc định nếu không đọc được
  }
  return cached;
}

export async function saveAppSettings(next: AppSettings): Promise<void> {
  cached = next;
  const token = getSessionAccessToken();
  if (token) {
    syncBackgroundNotifications(API_URL, token, next);
  }
  try {
    await SecureStore.setItemAsync(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Bỏ qua lỗi lưu trữ cục bộ
  }
}

/** Kiểm tra cài đặt có cho phép hiện banner + thông báo thanh trạng thái cho loại sự kiện này không */
export function shouldAlertForType(type: string, settings: AppSettings = cached): boolean {
  if (!settings.pushNotification) return false;
  if (type.startsWith('WEATHER_') && !settings.weatherNotification) return false;
  if (type.startsWith('TRIP_') && !settings.tripReminder) return false;
  return true;
}
