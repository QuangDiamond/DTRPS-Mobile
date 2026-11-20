import * as SecureStore from 'expo-secure-store';

// Lưu access token bền qua expo-secure-store (Keychain/EncryptedSharedPreferences) để không
// mất đăng nhập mỗi khi app bị kill — thay cho bộ nhớ tạm trước đây.
const TOKEN_KEY = 'dtrps_access_token';

let cached: string | null = null;
let loaded = false;

/** Đọc token đã lưu (nếu có) vào bộ nhớ tạm. Gọi một lần khi app khởi động. */
export async function loadAccessToken(): Promise<string | null> {
  if (loaded) return cached;
  try {
    cached = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    // Thiết bị không hỗ trợ SecureStore (hiếm) — coi như chưa đăng nhập.
    cached = null;
  }
  loaded = true;
  return cached;
}

export async function setAccessToken(token: string | null): Promise<void> {
  cached = token;
  loaded = true;
  try {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {
    // Lưu thất bại: token vẫn dùng được cho phiên hiện tại qua bộ nhớ tạm, chỉ mất khi tắt app.
  }
}

/** Đồng bộ, dùng trong httpClient để gắn Authorization — không await mỗi lần gọi API. */
export function getAccessToken(): string | null {
  return cached;
}

export async function clearAccessToken(): Promise<void> {
  await setAccessToken(null);
}
