export interface AuthCredentials { email: string; password: string }
export interface RegisterPayload extends AuthCredentials { name: string }
// Chưa có backend auth: tuyệt đối không lưu mật khẩu hoặc giả lập token đăng nhập.
export function validateEmail(email: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }
export function validatePassword(password: string): boolean { return password.length >= 8; }
