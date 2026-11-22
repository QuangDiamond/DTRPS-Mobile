import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { authApi } from '../api/authApi';
import { bindSession } from '../api/http';
import type { AuthResponse, ClientUser } from '../api/types';
import { userApi } from '../api/userApi';
import { requestGoogleIdToken, signOutGoogle } from './googleSignIn';
import { type ClientSession, clearSession, onboarding, readSession, writeSession } from './sessionStore';

interface AuthValue {
  /** false khi đang đọc phiên đã lưu lúc mở app */
  ready: boolean;
  user: ClientUser | null;
  /** Lý do vừa bị đăng xuất ngoài ý muốn (phiên hết hạn) để màn đăng nhập giải thích */
  endedReason: 'expired' | null;
  /** Đăng nhập cổng du khách; trả về true nếu là lần đầu sau khi đăng ký (cần trả lời sở thích) */
  login: (email: string, password: string, remember: boolean) => Promise<{ firstLogin: boolean }>;
  /** Tiếp tục với Google (giống web); newAccount = vừa tạo tài khoản → trả lời câu hỏi sở thích */
  loginWithGoogle: () => Promise<{ newAccount: boolean }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: ClientUser) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

const toSession = (response: AuthResponse, remember: boolean): ClientSession => ({
  accessToken: response.accessToken,
  refreshToken: response.refreshToken,
  user: response.user,
  remember,
});

/** Phiên đăng nhập của du khách — bản mobile của ClientAuthProvider bên web */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<ClientSession | null>(null);
  const [endedReason, setEndedReason] = useState<'expired' | null>(null);
  const sessionRef = useRef<ClientSession | null>(null);
  const refreshing = useRef<Promise<boolean> | null>(null);

  const save = useCallback((next: ClientSession | null) => {
    sessionRef.current = next;
    setSession(next);
    void (next ? writeSession(next) : clearSession());
  }, []);

  const refreshSession = useCallback(() => {
    if (refreshing.current) return refreshing.current;
    const current = sessionRef.current;
    if (!current) return Promise.resolve(false);
    refreshing.current = authApi
      .refresh(current.refreshToken)
      .then((response) => {
        save(toSession(response, current.remember));
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshing.current = null;
      });
    return refreshing.current;
  }, [save]);

  // Gắn phiên vào HTTP client ngay lần render đầu (đọc qua ref nên giữ suốt vòng đời app)
  useState(() => {
    bindSession({
      getAccessToken: () => sessionRef.current?.accessToken ?? null,
      refresh: refreshSession,
      onExpired: () => {
        if (sessionRef.current) setEndedReason('expired');
        save(null);
      },
    });
    return true;
  });

  // Mở app: đọc phiên đã lưu rồi lấy lại hồ sơ mới nhất (tự làm mới token nếu đã hết hạn)
  useEffect(() => {
    let active = true;
    void readSession().then(async (stored) => {
      if (!active) return;
      sessionRef.current = stored;
      setSession(stored);
      setReady(true);
      if (stored) {
        try {
          const me = await userApi.me();
          if (active && sessionRef.current) save({ ...sessionRef.current, user: me });
        } catch {
          // Mất mạng: vẫn dùng hồ sơ đã lưu; phiên hết hạn thì onExpired đã đăng xuất
        }
      }
    });
    return () => {
      active = false;
    };
  }, [save]);

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const response = await authApi.login(email, password);
      setEndedReason(null);
      save(toSession(response, remember));
      return { firstLogin: await onboarding.take(response.user.email) };
    },
    [save],
  );

  const loginWithGoogle = useCallback(async () => {
    const idToken = await requestGoogleIdToken();
    const { session: response, newAccount } = await authApi.googleSignIn(idToken);
    setEndedReason(null);
    // Giống web: đăng nhập Google luôn ghi nhớ
    save(toSession(response, true));
    return { newAccount };
  }, [save]);

  /** Đổi mật khẩu mà vẫn đăng nhập: BE đăng xuất thiết bị khác và cấp phiên mới cho máy này */
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const response = await userApi.changePassword(currentPassword, newPassword);
      save(toSession(response, sessionRef.current?.remember ?? true));
    },
    [save],
  );

  const logout = useCallback(() => {
    const current = sessionRef.current;
    if (current) authApi.revoke(current.refreshToken).catch(() => undefined);
    signOutGoogle();
    setEndedReason(null);
    save(null);
  }, [save]);

  const updateUser = useCallback(
    (next: ClientUser) => {
      const current = sessionRef.current;
      if (current) save({ ...current, user: next });
    },
    [save],
  );

  const value = useMemo(
    () => ({
      ready,
      user: session?.user ?? null,
      endedReason,
      login,
      loginWithGoogle,
      changePassword,
      logout,
      updateUser,
    }),
    [ready, session, endedReason, login, loginWithGoogle, changePassword, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth phải nằm trong AuthProvider');
  return value;
}
