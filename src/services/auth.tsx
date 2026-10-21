// API boundary: replace methods with HTTP requests when Spring Boot endpoints are ready.
export type Credentials = { email:string; password:string };
export type RegisterPayload = Credentials & { name:string };
export interface AuthService {
  login(payload:Credentials):Promise<void>;
  register(payload:RegisterPayload):Promise<void>;
  requestPasswordReset(email:string):Promise<void>;
  resetPassword(token:string,password:string):Promise<void>;
  changePassword(currentPassword:string,newPassword:string):Promise<void>;
}
export const authService:AuthService = {
  login: async()=>{ throw new Error('API đăng nhập chưa được kết nối.'); },
  register: async()=>{ throw new Error('API đăng ký chưa được kết nối.'); },
  requestPasswordReset: async()=>{ throw new Error('API gửi email chưa được kết nối.'); },
  resetPassword: async()=>{ throw new Error('API đặt lại mật khẩu chưa được kết nối.'); },
  changePassword: async()=>{ throw new Error('API đổi mật khẩu chưa được kết nối.'); },
};
