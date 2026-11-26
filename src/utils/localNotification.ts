import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

interface LocalNotificationNative {
  showNotification: (title: string, body: string, id: number) => void;
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

/** Bắn thông báo hệ thống ra thanh trạng thái Android (có fallback an toàn nếu chưa build native) */
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
