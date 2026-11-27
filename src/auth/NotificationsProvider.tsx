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
import { AppState } from 'react-native';
import { API_URL } from '../api/config';
import { getSessionAccessToken, refreshSessionToken } from '../api/http';
import { notificationApi } from '../api/notificationApi';
import { getCachedAppSettings, loadAppSettings, shouldAlertForType } from '../utils/appSettings';
import {
  clearBackgroundNotifications,
  markSeenNotificationId,
  requestNotificationPermission,
  showLocalNotification,
  syncBackgroundNotifications,
} from '../utils/localNotification';
import { useAuth } from './AuthProvider';

const FALLBACK_POLL_MS = 60_000;

export interface LiveNoticeBanner {
  id: number | null;
  type: string;
  title: string;
  message: string;
  link: string | null;
}

interface NotificationsValue {
  unread: number;
  /** Tăng mỗi khi nhận sự kiện realtime để các màn đang mở tự làm mới */
  version: number;
  /** Loại sự kiện realtime gần nhất (vd. SITE_ANNOUNCEMENT_CHANGED, REVIEW_HIDDEN) */
  lastEventType: string | null;
  /** Banner thông báo vừa tới (tự ẩn sau vài giây hoặc khi bấm đóng) */
  banner: LiveNoticeBanner | null;
  dismissBanner: () => void;
  /** Đọc lại số chưa đọc ngay (sau khi đánh dấu đã đọc…) */
  refresh: () => void;
}

const NotificationsContext = createContext<NotificationsValue>({
  unread: 0,
  version: 0,
  lastEventType: null,
  banner: null,
  dismissBanner: () => undefined,
  refresh: () => undefined,
});

/**
 * Nhận thông báo realtime qua SSE (`GET /api/notifications/stream`) giống hệt Web:
 * - Cập nhật số đỏ trên chuông ngay lập tức
 * - Hiện banner trượt từ trên xuống trong app + bắn thông báo ra thanh trạng thái Android
 * - Tự kết nối lại khi rớt mạng / hết hạn access token / quay lại app
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [version, setVersion] = useState(0);
  const [lastEventType, setLastEventType] = useState<string | null>(null);
  const [banner, setBanner] = useState<LiveNoticeBanner | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissBanner = useCallback(() => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
    setBanner(null);
  }, []);

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
      dismissBanner();
      clearBackgroundNotifications();
      return;
    }

    void loadAppSettings().then((settings) => {
      const token = getSessionAccessToken();
      if (token) syncBackgroundNotifications(API_URL, token, settings);
    });
    void requestNotificationPermission();
    refresh();

    let closed = false;
    let xhr: XMLHttpRequest | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 3_000;

    const handleSsePayload = (rawJson: string) => {
      try {
        const parsed = JSON.parse(rawJson) as {
          notificationId?: number | null;
          type?: string;
          title?: string;
          message?: string;
          link?: string | null;
        };
        if (!parsed.type) return;
        setLastEventType(parsed.type);
        setVersion((v) => v + 1);

        // Chỉ thông báo đã lưu (notificationId != null) mới tăng chuông;
        // banner nổi + thanh trạng thái tôn trọng công tắc trong Cài đặt ứng dụng.
        if (parsed.notificationId != null && parsed.title) {
          setUnread((count) => count + 1);
          markSeenNotificationId(parsed.notificationId);
          if (shouldAlertForType(parsed.type)) {
            const nextBanner: LiveNoticeBanner = {
              id: parsed.notificationId,
              type: parsed.type,
              title: parsed.title,
              message: parsed.message ?? '',
              link: parsed.link ?? null,
            };
            setBanner(nextBanner);
            if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
            bannerTimerRef.current = setTimeout(() => setBanner(null), 5_500);
            showLocalNotification(nextBanner.title, nextBanner.message, nextBanner.id);
          }
        }
      } catch {
        // Bỏ qua frame ping / không phải JSON
      }
    };

    const scheduleReconnect = () => {
      if (closed || reconnectTimer) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        void connect();
      }, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 20_000);
    };

    const connect = async () => {
      if (closed) return;
      if (xhr) {
        try {
          xhr.abort();
        } catch {
          // ignore
        }
        xhr = null;
      }

      let token = getSessionAccessToken();
      if (!token) {
        const ok = await refreshSessionToken();
        if (!ok || closed) return;
        token = getSessionAccessToken();
        if (!token) return;
      }
      syncBackgroundNotifications(API_URL, token, getCachedAppSettings());

      const request = new XMLHttpRequest();
      xhr = request;
      let cursor = 0;
      let buffer = '';

      request.open('GET', `${API_URL}/notifications/stream`, true);
      request.setRequestHeader('Accept', 'text/event-stream');
      request.setRequestHeader('Authorization', `Bearer ${token}`);

      request.onprogress = () => {
        if (closed || request !== xhr) return;
        retryDelay = 3_000;
        const text = request.responseText ?? '';
        if (text.length <= cursor) return;
        buffer += text.slice(cursor);
        cursor = text.length;

        const chunks = buffer.split(/\r?\n\r?\n/);
        buffer = chunks.pop() ?? '';
        for (const chunk of chunks) {
          const dataLines = chunk
            .split(/\r?\n/)
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim());
          if (dataLines.length > 0) {
            handleSsePayload(dataLines.join('\n'));
          }
        }
      };

      request.onreadystatechange = () => {
        if (closed || request !== xhr) return;
        if (request.readyState === 4) {
          xhr = null;
          if (request.status === 401) {
            void refreshSessionToken().then((ok) => {
              if (ok && !closed) void connect();
            });
          } else {
            scheduleReconnect();
          }
        }
      };

      request.onerror = () => {
        if (closed || request !== xhr) return;
        xhr = null;
        scheduleReconnect();
      };

      request.send();
    };

    void connect();

    // Poll dự phòng mỗi 60s để đảm bảo số chưa đọc luôn khớp nếu SSE tạm gián đoạn
    const pollTimer = setInterval(refresh, FALLBACK_POLL_MS);
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
        if (!xhr && !closed) {
          retryDelay = 3_000;
          void connect();
        }
      }
    });

    return () => {
      closed = true;
      clearInterval(pollTimer);
      appStateSub.remove();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      if (xhr) {
        try {
          xhr.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [user, refresh, dismissBanner]);

  const value = useMemo(
    () => ({ unread, version, lastEventType, banner, dismissBanner, refresh }),
    [unread, version, lastEventType, banner, dismissBanner, refresh],
  );
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsValue {
  return useContext(NotificationsContext);
}
