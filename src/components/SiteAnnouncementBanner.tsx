import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';
import { siteInfoApi, type SiteInfo } from '../api/siteInfoApi';
import { useNotifications } from '../auth/NotificationsProvider';
import { Icon, type IconName } from '../ui/Icon';
import { Text } from '../ui/Typography';

type Announcement = NonNullable<SiteInfo['announcement']>;

const DISMISS_KEY = 'smarttravel.dismissedAnnouncement';
const POLL_MS = 5 * 60 * 1000;

const STYLE: Record<
  Announcement['level'],
  { bg: string; border: string; fg: string; icon: IconName }
> = {
  INFO: { bg: '#F0F9FF', border: '#BAE6FD', fg: '#0C4A6E', icon: 'info' },
  WARNING: { bg: '#FFFBEB', border: '#FDE68A', fg: '#78350F', icon: 'warning' },
  CRITICAL: { bg: '#E11D48', border: '#BE123C', fg: '#FFFFFF', icon: 'error' },
};

/**
 * Banner thông báo toàn hệ thống do admin bật (giống SiteAnnouncementBanner của web).
 * Mức Khẩn cấp không đóng được; mức khác đóng thì không hiện lại tới khi admin sửa nội dung.
 */
export default function SiteAnnouncementBanner() {
  const { version, lastEventType } = useNotifications();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState<number | null>(null);

  const load = useCallback(() => {
    siteInfoApi
      .get()
      .then((info) => setAnnouncement(info.announcement))
      .catch(() => undefined);
  }, []);

  // Tự tải lại realtime ngay khi Admin thay đổi thông báo toàn hệ thống (giống Web)
  useEffect(() => {
    if (version > 0 && lastEventType?.startsWith('SITE_')) {
      load();
    }
  }, [version, lastEventType, load]);

  useEffect(() => {
    SecureStore.getItemAsync(DISMISS_KEY)
      .then((raw) => raw && setDismissed(Number(raw)))
      .catch(() => undefined);
    load();
    const timer = setInterval(load, POLL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [load]);

  // Tự ẩn đúng lúc hết hạn
  useEffect(() => {
    if (!announcement?.endsAt) return;
    const left = new Date(announcement.endsAt).getTime() - Date.now();
    if (left <= 0) {
      setAnnouncement(null);
      return;
    }
    const timer = setTimeout(() => setAnnouncement(null), Math.min(left, 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [announcement]);

  // App chỉ phục vụ du khách: bỏ banner chỉ dành cho đối tác (giống web ở chế độ du khách)
  if (!announcement || announcement.audience === 'PARTNER') return null;
  const critical = announcement.level === 'CRITICAL';
  if (!critical && dismissed === announcement.version) return null;

  const style = STYLE[announcement.level];
  return (
    <View
      style={{ backgroundColor: style.bg, borderColor: style.border }}
      className="mb-3 flex-row items-start gap-2.5 rounded-2xl border px-3.5 py-3"
    >
      <Icon name={style.icon} size={19} color={style.fg} style={{ marginTop: 1 }} />
      <Text style={{ color: style.fg }} className="flex-1 text-[12.5px] font-semibold leading-5">
        {announcement.message}
      </Text>
      {!critical ? (
        <Pressable
          onPress={() => {
            setDismissed(announcement.version);
            SecureStore.setItemAsync(DISMISS_KEY, String(announcement.version)).catch(
              () => undefined,
            );
          }}
          hitSlop={8}
          accessibilityLabel="Đóng thông báo"
        >
          <Icon name="close" size={18} color={style.fg} />
        </Pressable>
      ) : null}
    </View>
  );
}
