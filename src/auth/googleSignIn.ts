import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

/**
 * Client ID web của Google (cùng giá trị VITE_GOOGLE_CLIENT_ID của web và GOOGLE_CLIENT_ID của
 * Backend). ID token Google trả cho app có aud = Client ID này nên Backend chấp nhận như với web.
 */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

/** Người dùng tự đóng cửa sổ chọn tài khoản — không coi là lỗi */
export class GoogleCancelled extends Error {}

let configured = false;

/** Mở cửa sổ chọn tài khoản Google, trả về ID token */
export async function requestGoogleIdToken(): Promise<string> {
  if (!WEB_CLIENT_ID) {
    throw new Error('Đăng nhập Google chưa được cấu hình (thiếu EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID).');
  }
  if (!configured) {
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, scopes: ['profile', 'email'] });
    configured = true;
  }
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Luôn cho chọn lại tài khoản (giống cửa sổ Google trên web)
    await GoogleSignin.signOut().catch(() => undefined);
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) throw new GoogleCancelled();
    const idToken = response.data.idToken ?? (await GoogleSignin.getTokens()).idToken;
    if (!idToken) throw new Error('Google không trả về thông tin đăng nhập, vui lòng thử lại.');
    return idToken;
  } catch (error) {
    if (error instanceof GoogleCancelled) throw error;
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) throw new GoogleCancelled();
      if (error.code === statusCodes.IN_PROGRESS) throw new Error('Đang mở đăng nhập Google, vui lòng chờ.');
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Thiết bị chưa có Google Play Services nên không đăng nhập Google được.');
      }
      // DEVELOPER_ERROR (10): Google Cloud chưa có OAuth Client Android đúng package + SHA-1
      if (String(error.code) === '10' || error.code === 'DEVELOPER_ERROR') {
        throw new Error('Cấu hình Google chưa khớp với app (OAuth Client Android: package + SHA-1).');
      }
    }
    throw error instanceof Error ? error : new Error('Không đăng nhập được với Google, vui lòng thử lại.');
  }
}

/** Đăng xuất Google trên máy (khi đăng xuất khỏi app) */
export function signOutGoogle(): void {
  if (configured) GoogleSignin.signOut().catch(() => undefined);
}
