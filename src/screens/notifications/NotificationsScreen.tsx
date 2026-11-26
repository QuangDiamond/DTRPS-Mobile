import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { errorMessage } from '../../api/http';
import {
  NOTIFICATION_CATEGORIES,
  notificationApi,
  timeAgo,
  type AppNotification,
} from '../../api/notificationApi';
import { useNotifications } from '../../auth/NotificationsProvider';
import type { RootNav } from '../../navigation/hooks';
import type { RootScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { Chip } from '../../ui/Bits';
import { Icon, type IconName } from '../../ui/Icon';
import { Header, Screen } from '../../ui/Screen';
import { EmptyState, ErrorState, Loading } from '../../ui/States';
import { FadeInView, ListCardSkeleton, ScalePressable } from '../../ui/Motion';
import { Toast, useToast } from '../../ui/Toast';
import { Text } from '../../ui/Typography';

/** Chấm xanh nhịp thở nhẹ cho thông báo chưa đọc */
function UnreadDot() {
  const pulse = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={{ opacity: pulse }}
      className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[#0891B2]"
    />
  );
}

const PAGE_SIZE = 20;

/** Đổi đường dẫn trang web trong thông báo sang màn tương ứng của app */
export function openNotificationLink(
  navigation: Pick<RootNav, 'navigate'>,
  link: string | null,
): void {
  if (!link) return;
  const [path, search = ''] = link.split('?');
  const params = new Map(
    search
      .split('&')
      .filter(Boolean)
      .map((pair) => pair.split('=') as [string, string]),
  );
  const planId = Number(params.get('planId'));
  const place = path.match(/^\/(?:explore|favorites|trips\/suggestions)\/(\d+)$/);
  if (place) return navigation.navigate('PlaceDetail', { placeId: Number(place[1]) });
  const day = path.match(/^\/trips\/itinerary\/day\/(\d+)/);
  if (day && planId > 0)
    return navigation.navigate('ItineraryDay', { planId, day: Number(day[1]) });
  if (path === '/trips/itinerary' && planId > 0)
    return navigation.navigate('Itinerary', { planId });
  if (path === '/trips/plan/selected' && planId > 0)
    return navigation.navigate('SelectedPlaces', { planId });
  if (path === '/preferences') return navigation.navigate('Preferences');
  const tabs: Record<string, 'Trips' | 'Favorites' | 'Profile' | 'Explore' | 'Home'> = {
    '/trips': 'Trips',
    '/favorites': 'Favorites',
    '/profile': 'Profile',
    '/explore': 'Explore',
    '/': 'Home',
  };
  if (tabs[path]) navigation.navigate('Tabs', { screen: tabs[path] });
}

/** Danh sách thông báo — cùng dữ liệu với chuông thông báo của web */
export default function NotificationsScreen({ navigation }: RootScreenProps<'Notifications'>) {
  const { refresh, version } = useNotifications();
  const [toast, showToast] = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [unread, setUnread] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const query = useCallback(
    (nextPage: number) =>
      notificationApi.list({
        category: category === 'all' ? undefined : category,
        unread: unreadOnly,
        page: nextPage,
        size: PAGE_SIZE,
      }),
    [category, unreadOnly],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(null);
      query(0)
        .then((result) => {
          if (!active) return;
          setItems(result.items);
          setTotal(result.total);
          setUnread(result.unread);
          setCategories(result.categories ?? {});
          setPage(0);
        })
        .catch((caught: unknown) => active && setError(errorMessage(caught)))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [query, retry, version]),
  );

  const loadMore = () => {
    if (loading || loadingMore || items.length >= total) return;
    setLoadingMore(true);
    query(page + 1)
      .then((result) => {
        setItems((current) => [
          ...current,
          ...result.items.filter((item) => !current.some((c) => c.id === item.id)),
        ]);
        setTotal(result.total);
        setPage((p) => p + 1);
      })
      .catch(() => undefined)
      .finally(() => setLoadingMore(false));
  };

  const markAllRead = () =>
    notificationApi
      .markAllRead()
      .then(() => {
        setItems((current) => current.map((item) => ({ ...item, read: true })));
        setUnread(0);
        setCategories((current) => Object.fromEntries(Object.keys(current).map((key) => [key, 0])));
        refresh();
        showToast('Đã đánh dấu tất cả thông báo là đã đọc');
      })
      .catch(() => undefined);

  const onPullRefresh = () => {
    setRefreshing(true);
    query(0)
      .then((result) => {
        setItems(result.items);
        setTotal(result.total);
        setUnread(result.unread);
        setCategories(result.categories ?? {});
        setPage(0);
        refresh();
      })
      .catch(() => undefined)
      .finally(() => setRefreshing(false));
  };

  const open = (item: AppNotification) => {
    if (!item.read) {
      notificationApi
        .markRead(item.id)
        .then(refresh)
        .catch(() => undefined);
      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)),
      );
      setUnread((n) => Math.max(0, n - 1));
    }
    openNotificationLink(navigation, item.link);
  };

  const tabs = [
    { value: 'all', label: 'Tất cả', count: unread },
    ...Object.entries(categories).map(([key, count]) => ({
      value: key,
      label: (NOTIFICATION_CATEGORIES[key] ?? NOTIFICATION_CATEGORIES.OTHER).label,
      count,
    })),
  ];

  return (
    <Screen
      scroll={false}
      header={
        <Header
          title="Thông báo"
          subtitle={unread > 0 ? `${unread} chưa đọc` : undefined}
          onBack={() => navigation.goBack()}
          right={
            unread > 0 ? (
              <ScalePressable
                scaleTo={0.93}
                onPress={() => void markAllRead()}
                className="rounded-full bg-[#ECFEFF] px-3 py-2"
                accessibilityLabel="Đánh dấu tất cả đã đọc"
              >
                <Text className="text-[11.5px] font-bold text-[#0E7490]">Đọc tất cả</Text>
              </ScalePressable>
            ) : undefined
          }
        />
      }
    >
      <FlatList
        data={loading || error ? [] : items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View className="mb-1">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {tabs.map((tab) => (
                <Chip
                  key={tab.value}
                  label={tab.count > 0 ? `${tab.label} (${tab.count})` : tab.label}
                  selected={category === tab.value}
                  onPress={() => setCategory(tab.value)}
                />
              ))}
            </ScrollView>
            <View className="mt-2.5 flex-row gap-2">
              {[
                { value: false, label: 'Tất cả' },
                { value: true, label: 'Chưa đọc' },
              ].map((option) => (
                <Pressable
                  key={option.label}
                  onPress={() => setUnreadOnly(option.value)}
                  className={`rounded-full px-3 py-1.5 ${unreadOnly === option.value ? 'bg-[#0F2A3B]' : 'bg-[#EEF3F5]'}`}
                >
                  <Text
                    className={`text-[11.5px] font-bold ${unreadOnly === option.value ? 'text-white' : 'text-[#557080]'}`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const meta = NOTIFICATION_CATEGORIES[item.category] ?? NOTIFICATION_CATEGORIES.OTHER;
          return (
            <FadeInView delay={Math.min(index, 5) * 35} offset={8} duration={220}>
              <ScalePressable
                scaleTo={0.98}
                onPress={() => open(item)}
                style={{
                  backgroundColor: item.read ? '#FFFFFF' : '#EFFBFD',
                  borderColor: item.read ? colors.line : '#BDEFF7',
                }}
                className="flex-row gap-3 rounded-2xl border p-3.5"
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#ECFEFF]">
                  <Icon name={meta.icon as IconName} size={20} color={colors.primary} />
                </View>
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-start gap-2">
                    <Text
                      className={`flex-1 text-[13.5px] ${item.read ? 'font-semibold' : 'font-extrabold'} text-[#13364A]`}
                    >
                      {item.title}
                    </Text>
                    {!item.read ? <UnreadDot /> : null}
                  </View>
                  <Text className="mt-0.5 text-[12.5px] leading-[18px] text-[#557080]">
                    {item.message}
                  </Text>
                  <Text className="mt-1 text-[11px] text-[#93A7B1]">
                    {meta.label} · {timeAgo(item.createdAt)}
                  </Text>
                </View>
              </ScalePressable>
            </FadeInView>
          );
        }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          loading ? (
            <ListCardSkeleton count={4} />
          ) : error ? (
            <ErrorState message={error} onRetry={() => setRetry((n) => n + 1)} />
          ) : (
            <EmptyState
              icon="notifications-none"
              title={unreadOnly ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            />
          )
        }
        ListFooterComponent={loadingMore ? <Loading label="Đang tải thêm…" /> : null}
      />
      <Toast message={toast} />
    </Screen>
  );
}
