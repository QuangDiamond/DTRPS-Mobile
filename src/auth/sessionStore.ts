/**
 * Lưu phiên đăng nhập bằng expo-secure-store (Keychain / EncryptedSharedPreferences).
 * Mỗi giá trị một khóa riêng vì SecureStore giới hạn ~2KB mỗi giá trị.
 * "Ghi nhớ đăng nhập" tắt → phiên chỉ nằm trong bộ nhớ, tắt app là mất (giống sessionStorage của web).
 */
import * as SecureStore from 'expo-secure-store';
import type { ClientUser } from '../api/types';

const ACCESS = 'smarttravel.access';
const REFRESH = 'smarttravel.refresh';
const USER = 'smarttravel.user';

export interface ClientSession {
  accessToken: string;
  refreshToken: string;
  user: ClientUser;
  remember: boolean;
}

function isUser(value: unknown): value is ClientUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ClientUser).email === 'string' &&
    Array.isArray((value as ClientUser).roles)
  );
}

export async function readSession(): Promise<ClientSession | null> {
  try {
    const [accessToken, refreshToken, rawUser] = await Promise.all([
      SecureStore.getItemAsync(ACCESS),
      SecureStore.getItemAsync(REFRESH),
      SecureStore.getItemAsync(USER),
    ]);
    if (!accessToken || !refreshToken || !rawUser) return null;
    const user: unknown = JSON.parse(rawUser);
    return isUser(user) ? { accessToken, refreshToken, user, remember: true } : null;
  } catch {
    return null;
  }
}

export async function writeSession(session: ClientSession): Promise<void> {
  if (!session.remember) {
    await clearSession();
    return;
  }
  try {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS, session.accessToken),
      SecureStore.setItemAsync(REFRESH, session.refreshToken),
      SecureStore.setItemAsync(USER, JSON.stringify(session.user)),
    ]);
  } catch {
    // Không lưu được: phiên vẫn dùng được tới khi tắt app
  }
}

export async function clearSession(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS),
      SecureStore.deleteItemAsync(REFRESH),
      SecureStore.deleteItemAsync(USER),
    ]);
  } catch {
    // bỏ qua
  }
}

const ONBOARDING = 'smarttravel.onboarding';

/**
 * Tài khoản vừa đăng ký trên máy này: lần đăng nhập đầu tiên đi qua màn câu hỏi sở thích trước
 * (giống web).
 */
export const onboarding = {
  async mark(email: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ONBOARDING, email.trim().toLowerCase());
    } catch {
      // bỏ qua
    }
  },
  /** true nếu email này vừa đăng ký và chưa qua bước câu hỏi — đồng thời xoá đánh dấu */
  async take(email: string): Promise<boolean> {
    try {
      const saved = await SecureStore.getItemAsync(ONBOARDING);
      if (saved !== email.trim().toLowerCase()) return false;
      await SecureStore.deleteItemAsync(ONBOARDING);
      return true;
    } catch {
      return false;
    }
  },
};
