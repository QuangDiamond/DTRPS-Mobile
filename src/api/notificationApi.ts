import { buildQuery, clientRequest } from './http';

/** Một thông báo đã lưu (khớp NotificationResponse bên Backend) */
export interface AppNotification {
  id: number;
  type: string;
  /** Nhóm: REVIEW, LISTING, ADS, TRIP, OTHER */
  category: string;
  title: string;
  message: string;
  /** Đường dẫn trang web (vd. /explore/12) — app đổi sang màn tương ứng */
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationPageResult {
  items: AppNotification[];
  total: number;
  page: number;
  size: number;
  unread: number;
  /** Nhóm người dùng đang có thông báo → số chưa đọc */
  categories: Record<string, number>;
}

/** Nhãn nhóm thông báo — giống notificationMeta.ts của web */
export const NOTIFICATION_CATEGORIES: Record<string, { label: string; icon: string }> = {
  LISTING: { label: 'Niêm yết', icon: 'storefront' },
  ADS: { label: 'Quảng cáo', icon: 'campaign' },
  REVIEW: { label: 'Đánh giá', icon: 'reviews' },
  TRIP: { label: 'Chuyến đi', icon: 'luggage' },
  OTHER: { label: 'Khác', icon: 'notifications' },
};

/** Thông báo của người dùng đang đăng nhập — cùng API với chuông thông báo của web */
export const notificationApi = {
  list: ({ category, unread, page, size }: { category?: string; unread?: boolean; page: number; size: number }) =>
    clientRequest<NotificationPageResult>(
      `/notifications?${buildQuery({ page, size, category, unread: unread ? true : undefined })}`,
    ),
  unreadCount: () => clientRequest<{ unread: number }>('/notifications/unread-count').then((r) => r.unread),
  markRead: (id: number) => clientRequest<AppNotification>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => clientRequest<unknown>('/notifications/read-all', { method: 'POST' }),
};

/** "Vừa xong", "5 phút trước"… (giống timeAgo của web) */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 45) return 'Vừa xong';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}
