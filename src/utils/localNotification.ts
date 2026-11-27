import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

interface LocalNotificationNative {
  showNotification: (title: string, body: string, id: number) => void;
  syncBackgroundConfig?: (
    apiUrl: string,
    accessToken: string,
    pushEnabled: boolean,
    tripEnabled: boolean,
    weatherEnabled: boolean,
  ) => void;
  markSeenNotificationId?: (id: number) => void;
  clearBackgroundConfig?: () => void;
}

const nativeModule = NativeModules.LocalNotificationModule as LocalNotificationNative | undefined;

/** Xin quyền hiện thông báo trên thanh trạng thái Android 13+ (API 33+) */
export async function requestNotificationPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (typeof Platform.Version === 'number' && Platform.Version < 33) return;
  try {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  } catch {
    // Bỏ qua nếu thiết bị từ chối hoặc không hỗ trợ
  }
}

/** Bắn thông báo hệ thống ra thanh trạng thái Android */
export function showLocalNotification(title: string, body: string, id?: number | null): void {
  if (Platform.OS !== 'android' || !nativeModule?.showNotification) return;
  try {
    const safeId =
      typeof id === 'number' && Number.isFinite(id)
        ? Math.abs(Math.trunc(id)) % 2_000_000_000
        : Math.floor(Date.now() % 2_000_000_000);
    nativeModule.showNotification(title, body, safeId);
  } catch {
    // Không làm gián đoạn luồng UI
  }
}

/** Đồng bộ token & cấu hình xuống Android WorkManager để tắt app vẫn nhận thông báo nền */
export function syncBackgroundNotifications(
  apiUrl: string,
  accessToken: string,
  opts: { pushNotification: boolean; tripReminder: boolean; weatherNotification: boolean },
): void {
  if (Platform.OS !== 'android' || !nativeModule?.syncBackgroundConfig) return;
  try {
    nativeModule.syncBackgroundConfig(
      apiUrl,
      accessToken,
      opts.pushNotification,
      opts.tripReminder,
      opts.weatherNotification,
    );
  } catch {
    // ignore
  }
}

/** Đánh dấu ID thông báo đã hiển thị để tác vụ nền không bắn trùng */
export function markSeenNotificationId(id?: number | null): void {
  if (Platform.OS !== 'android' || !nativeModule?.markSeenNotificationId) return;
  if (typeof id !== 'number' || !Number.isFinite(id) || id <= 0) return;
  try {
    nativeModule.markSeenNotificationId(Math.trunc(id));
  } catch {
    // ignore
  }
}

/** Hủy lịch nền và xóa token khi đăng xuất */
export function clearBackgroundNotifications(): void {
  if (Platform.OS !== 'android' || !nativeModule?.clearBackgroundConfig) return;
  try {
    nativeModule.clearBackgroundConfig();
  } catch {
    // ignore
  }
}
