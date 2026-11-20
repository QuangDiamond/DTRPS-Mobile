import { clientRequest, errorMessage } from './httpClient';
import { setAccessToken, clearAccessToken } from './authToken';

export type Credentials = { email:string; password:string };
export type RegisterPayload = Credentials & { name:string };

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: { userId: number; name: string; email: string; roles: string[] };
}

export interface AuthService {
  login(payload:Credentials):Promise<void>;
  register(payload:RegisterPayload):Promise<void>;
  requestPasswordReset(email:string):Promise<void>;
  resetPassword(token:string,password:string):Promise<void>;
  changePassword(currentPassword:string,newPassword:string):Promise<void>;
}

export const authService:AuthService = {
  login: async ({ email, password }) => {
    try {
      const auth = await clientRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      });
      await setAccessToken(auth.accessToken);
    } catch (caught) {
      throw new Error(errorMessage(caught));
    }
  },

  // Dùng endpoint đăng ký trực tiếp (POST /auth/register, tạo tài khoản ngay lập tức).
  // Backend còn có luồng OTP riêng (/auth/register/otp, /verify, /complete) — không dùng ở đây,
  // vì màn RegistrationScreen hiện tại không có bước nhập OTP.
  register: async ({ name, email, password }) => {
    try {
      const auth = await clientRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: { name, email, password },
        auth: false,
      });
      await setAccessToken(auth.accessToken);
    } catch (caught) {
      throw new Error(errorMessage(caught));
    }
  },

  requestPasswordReset: async()=>{ throw new Error('API gửi email chưa được kết nối.'); },
  resetPassword: async()=>{ throw new Error('API đặt lại mật khẩu chưa được kết nối.'); },
  changePassword: async()=>{ throw new Error('API đổi mật khẩu chưa được kết nối.'); },
};

export async function logoutLocal(): Promise<void> {
  await clearAccessToken();
}
