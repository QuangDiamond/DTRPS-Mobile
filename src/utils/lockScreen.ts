import { NativeModules, Platform } from 'react-native';

interface LockScreenNativeModule {
  setNavigationMode?: (enabled: boolean) => void;
}

const lockScreenModule = NativeModules.LockScreen as LockScreenNativeModule | undefined;

/**
 * Bật/tắt chế độ hiển thị bản đồ dẫn đường đè lên màn hình khóa (Show When Locked)
 * và giữ màn hình luôn sáng trên Android. An toàn (no-op) trên iOS/Web.
 */
export function setNavigationLockScreen(enabled: boolean): void {
  if (Platform.OS !== 'android') return;
  try {
    lockScreenModule?.setNavigationMode?.(enabled);
  } catch {
    // Bỏ qua nếu bản build chưa có native module LockScreen
  }
}
