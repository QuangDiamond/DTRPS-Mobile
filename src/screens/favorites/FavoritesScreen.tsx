import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '../../api/http';
import type { PlaceSummary } from '../../api/types';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../auth/AuthProvider';
import { useFavorites } from '../../auth/FavoritesProvider';
import { LoginRequired } from '../../components/LoginRequired';
import { useRootNav } from '../../navigation/hooks';
import { colors, shadow } from '../../theme';
import { Chip, Cover } from '../../ui/Bits';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { EmptyState, ErrorState, Loading } from '../../ui/States';
import { FadeInView, PlaceCardSkeleton } from '../../ui/Motion';

const PAGE_SIZE = 12;
type SortMode = 'recent' | 'name';
type GroupFilter = 'all' | 'lodging' | 'fnb' | 'attraction' | 'shopping';
const GROUP_FILTERS: { id: GroupFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'lodging', label: 'Lưu trú' },
  { id: 'fnb', label: 'Ẩm thực' },
  { id: 'attraction', label: 'Vui chơi & Tham quan' },
  { id: 'shopping', label: 'Mua sắm & Đặc sản' },
];
const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'recent', label: 'Mới lưu gần đây' },
  { id: 'name', label: 'Tên A - Z' },
];

function FavoriteCard({
  place,
  onOpen,
  onRemove,
}: {
  place: PlaceSummary;
  onOpen: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={shadow.card} className="overflow-hidden rounded-[22px] bg-white">
      <Pressable onPress={onOpen}>
        <Cover uri={place.coverUrl} height={165} icon="image" />
        <View className="absolute bottom-3 left-3 flex-row items-center gap-1 rounded-full bg-black/50 px-2.5 py-1">
          <Icon name="location-on" size={13} color="#FFFFFF" />
          <Text className="text-[10.5px] font-bold text-white">{place.province?.name ?? '—'}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onRemove}
        accessibilityLabel="Bỏ yêu thích"
        className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-white"
      >
        <Icon name="favorite" size={20} color="#E5484D" />
      </Pressable>
      <View className="px-4 pb-4 pt-3">
        <View className="flex-row items-start gap-3">
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="text-[16px] font-extrabold text-[#13364A]">
              {place.name}
            </Text>
            <View className="mt-1 flex-row items-center gap-1">
              <Icon name="star" size={15} color="#E0A100" />
              <Text className="text-[11.5px] font-bold text-[#13364A]">
                {place.rating ?? 'Mới'}
              </Text>
              <Text className="text-[11.5px] text-[#72818C]">({place.reviewCount} đánh giá)</Text>
            </View>
          </View>
          {place.category ? (
            <View className="items-end">
              <Text className="text-[10px] text-[#72818C]">Loại hình</Text>
              <Text
                numberOfLines={1}
                className="max-w-[120px] text-[13px] font-extrabold text-[#C2410C]"
              >
                {place.category.name}
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable
          onPress={onOpen}
          className="mt-3 h-11 items-center justify-center rounded-2xl bg-[#ECFEFF]"
        >
          <Text className="text-[13px] font-bold text-[#0E7490]">Xem chi tiết</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Địa điểm yêu thích — GET /api/users/me/favorites (giống FavoritesPage của web) */
export default function FavoritesScreen() {
  const { user } = useAuth();
  const navigation = useRootNav();
  const { toggleFavorite, version } = useFavorites();
  const [places, setPlaces] = useState<PlaceSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupFilter>('all');
  const [sort, setSort] = useState<SortMode>('recent');
  const [retry, setRetry] = useState(0);

  // Mỗi lần mở tab (hoặc đổi bộ lọc) tải lại trang đầu từ Backend
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;
      setLoading(true);
      setLoadError(null);
      userApi
        .favorites({ page: 0, size: PAGE_SIZE, group, sort })
        .then((result) => {
          if (!active) return;
          setPlaces(result.items);
          setTotal(result.total);
          setPage(0);
        })
        .catch((failure: unknown) => active && setLoadError(errorMessage(failure)))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [user, group, sort, retry, version]),
  );

  if (!user) {
    return (
      <LoginRequired
        title="Địa điểm yêu thích"
        message="Đăng nhập để lưu và xem lại các địa điểm bạn thích."
      />
    );
  }

  const loadMore = () => {
    if (loadingMore || loading || places.length >= total) return;
    const next = page + 1;
    setLoadingMore(true);
    userApi
      .favorites({ page: next, size: PAGE_SIZE, group, sort })
      .then((result) => {
        setPlaces((current) => {
          const seen = new Set(current.map((item) => item.id));
          return [...current, ...result.items.filter((item) => !seen.has(item.id))];
        });
        setTotal(result.total);
        setPage(next);
      })
      .catch(() => undefined)
      .finally(() => setLoadingMore(false));
  };

  const remove = (place: PlaceSummary) =>
    Alert.alert('Bỏ yêu thích', `Bỏ "${place.name}" khỏi danh sách yêu thích?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Bỏ yêu thích',
        style: 'destructive',
        onPress: () => {
          toggleFavorite(place.id);
          setPlaces((current) => current.filter((item) => item.id !== place.id));
          setTotal((current) => Math.max(0, current - 1));
        },
      },
    ]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={loading || loadError ? [] : places}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
        ListHeaderComponent={
          <View>
            <View className="flex-row items-baseline gap-2">
              <Text className="text-[22px] font-extrabold text-[#13364A]">Địa điểm yêu thích</Text>
              <Text className="text-[12px] font-semibold text-[#0891B2]">
                ({total} điểm đã lưu)
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
            >
              {GROUP_FILTERS.map((item) => (
                <Chip
                  key={item.id}
                  label={item.label}
                  selected={group === item.id}
                  onPress={() => setGroup(item.id)}
                />
              ))}
            </ScrollView>
            <View className="mb-1 flex-row gap-2">
              {SORT_OPTIONS.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setSort(item.id)}
                  className={`rounded-full px-3 py-1.5 ${sort === item.id ? 'bg-[#0F2A3B]' : 'bg-[#EEF3F5]'}`}
                >
                  <Text
                    className={`text-[11.5px] font-bold ${sort === item.id ? 'text-white' : 'text-[#557080]'}`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeInView delay={Math.min(index, 5) * 45} offset={10} duration={240}>
            <FavoriteCard
              place={item}
              onOpen={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
              onRemove={() => remove(item)}
            />
          </FadeInView>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          loading ? (
            <View className="gap-3.5">
              <PlaceCardSkeleton compact />
              <PlaceCardSkeleton compact />
              <PlaceCardSkeleton compact />
            </View>
          ) : loadError ? (
            <ErrorState message={loadError} onRetry={() => setRetry((n) => n + 1)} />
          ) : (
            <EmptyState
              icon="favorite-border"
              title={
                group !== 'all'
                  ? 'Không có địa điểm nào trong nhóm này'
                  : 'Chưa có địa điểm yêu thích'
              }
              message="Bấm vào trái tim trên địa điểm bạn thích để lưu lại xem sau."
              action={
                <Button
                  title="Khám phá địa điểm"
                  icon="explore"
                  onPress={() => navigation.navigate('Tabs', { screen: 'Explore' })}
                />
              }
            />
          )
        }
        ListFooterComponent={loadingMore ? <Loading label="Đang tải thêm…" /> : null}
      />
    </SafeAreaView>
  );
}
