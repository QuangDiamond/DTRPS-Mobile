import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { notificationApi } from '../api/notificationApi';
import { useAuth } from './AuthProvider';

const POLL_MS = 60_000;

interface NotificationsValue {
  unread: number;
  /** Đọc lại số chưa đọc ngay (sau khi đánh dấu đã đọc…) */
  refresh: () => void;
}

const NotificationsContext = createContext<NotificationsValue>({ unread: 0, refresh: () => undefined });

/**
 * Số thông báo chưa đọc cho chuông ở Trang chủ. Web nhận realtime; app hỏi lại định kỳ khi đang mở
 * và mỗi lần quay lại app.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(() => {
    if (!user) return;
    notificationApi
      .unreadCount()
      .then(setUnread)
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [user, refresh]);

  const value = useMemo(() => ({ unread, refresh }), [unread, refresh]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsValue {
  return useContext(NotificationsContext);
}
