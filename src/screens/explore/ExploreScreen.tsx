import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { Text, TextInput } from '../../ui/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '../../api/http';
import { placesApi } from '../../api/placesApi';
import { referenceApi } from '../../api/referenceApi';
import type { CategoryGroup, PlaceSummary, ReferenceItem } from '../../api/types';
import PlaceCard, { GROUP_ICONS } from '../../components/PlaceCard';
import { useRootNav } from '../../navigation/hooks';
import { colors, shadow } from '../../theme';
import { Chip, Sheet } from '../../ui/Bits';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { EmptyState, ErrorState, Loading } from '../../ui/States';
import { FadeInView, PlaceCardSkeleton, ScalePressable } from '../../ui/Motion';
import { fold } from '../../utils/format';

type SortMode = 'default' | 'rating' | 'popular';
type RatingMode = 0 | 3.5 | 4 | 4.5;

const PAGE_SIZE = 24;
const RATINGS: RatingMode[] = [0, 3.5, 4, 4.5];
const SORTS: { value: SortMode; label: string }[] = [
  { value: 'default', label: 'Mới cập nhật' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'popular', label: 'Nhiều đánh giá' },
];
const QUICK_PROVINCES = ['Hà Nội', 'Hải Phòng', 'Đà Nẵng', 'TP. Hồ Chí Minh', 'Quảng Ninh'];

/**
 * Khám phá — giống ExplorePage của web: ô tìm CHỈ chọn tỉnh/thành, lọc theo loại hình,
 * đánh giá tối thiểu, sắp xếp, tải thêm.
 */
export default function ExploreScreen() {
  const navigation = useRootNav();
  const [provinces, setProvinces] = useState<ReferenceItem[]>([]);
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [province, setProvince] = useState<ReferenceItem | null>(null);
  const [searchText, setSearchText] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<RatingMode>(0);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [places, setPlaces] = useState<PlaceSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPage, setNextPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const requestVersion = useRef(0);

  useEffect(() => {
    referenceApi
      .provinces()
      .then(setProvinces)
      .catch(() => undefined);
    referenceApi
      .categories()
      .then(setGroups)
      .catch(() => undefined);
  }, []);

  const suggestions = useMemo(() => {
    const term = fold(searchText);
    if (!term) return [];
    return provinces
      .filter((item) => fold(item.name).includes(term))
      .sort((a, b) => {
        const aStart = fold(a.name).startsWith(term) ? 0 : 1;
        const bStart = fold(b.name).startsWith(term) ? 0 : 1;
        return aStart - bStart || a.name.localeCompare(b.name, 'vi');
      })
      .slice(0, 8);
  }, [provinces, searchText]);

  const quickProvinces = useMemo(
    () =>
      QUICK_PROVINCES.map((name) => provinces.find((item) => fold(item.name) === fold(name)))
        .filter((item): item is ReferenceItem => item !== undefined)
        .slice(0, 4),
    [provinces],
  );

  // Lọc ở server khi chọn đúng 1 loại hình con (giống web)
  const serverCategory = useMemo(() => {
    if (selectedCodes.length !== 1) return undefined;
    const code = selectedCodes[0];
    return groups.some((group) => group.subtypes.some((sub) => sub.code === code))
      ? code
      : undefined;
  }, [groups, selectedCodes]);

  useEffect(() => {
    let alive = true;
    const version = ++requestVersion.current;
    setLoading(true);
    setLoadError(null);
    placesApi
      .list({ province: province?.code, category: serverCategory, page: 0, size: PAGE_SIZE })
      .then((result) => {
        if (!alive || version !== requestVersion.current) return;
        setPlaces(result.items);
        setTotal(result.total);
        setNextPage(1);
      })
      .catch((error: unknown) => {
        if (!alive || version !== requestVersion.current) return;
        setPlaces([]);
        setTotal(0);
        setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (alive && version === requestVersion.current) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [province, serverCategory, retry]);

  const selectedCategories = useMemo(
    () =>
      groups.flatMap((group) =>
        [group, ...group.subtypes].filter((item) => selectedCodes.includes(item.code)),
      ),
    [groups, selectedCodes],
  );

  const visiblePlaces = useMemo(() => {
    const result = places.filter((place) => {
      if ((place.rating ?? 0) < minRating) return false;
      if (!selectedCategories.length) return true;
      const fields = [
        place.group?.code ?? '',
        place.group?.name ?? '',
        place.category?.code ?? '',
        place.category?.name ?? '',
        ...(place.groups ?? []).flatMap((group) => [group.code, group.name]),
        ...(place.categories ?? []).flatMap((category) => [category.code, category.name]),
      ].map(fold);
      return selectedCategories.some((category) =>
        fields.some((field) => field === fold(category.code) || field === fold(category.name)),
      );
    });
    if (sortMode === 'rating') {
      return [...result].sort(
        (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || b.reviewCount - a.reviewCount,
      );
    }
    if (sortMode === 'popular') return [...result].sort((a, b) => b.reviewCount - a.reviewCount);
    return result;
  }, [places, minRating, selectedCategories, sortMode]);

  const loadMore = () => {
    if (loadingMore || loading || places.length >= total) return;
    const version = requestVersion.current;
    setLoadingMore(true);
    placesApi
      .list({ province: province?.code, category: serverCategory, page: nextPage, size: PAGE_SIZE })
      .then((result) => {
        if (version !== requestVersion.current) return;
        setPlaces((current) => {
          const seen = new Set(current.map((item) => item.id));
          return [...current, ...result.items.filter((item) => !seen.has(item.id))];
        });
        setTotal(result.total);
        setNextPage((page) => page + 1);
      })
      .catch(() => undefined)
      .finally(() => setLoadingMore(false));
  };

  const chooseProvince = (item: ReferenceItem) => {
    setProvince(item);
    setSearchText(item.name);
    setSuggestionsOpen(false);
  };

  const clearProvince = () => {
    setProvince(null);
    setSearchText('');
    setSuggestionsOpen(false);
  };

  const toggleCode = (code: string) =>
    setSelectedCodes((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );

  const chooseGroup = (code: string) =>
    setSelectedCodes((current) => (current.length === 1 && current[0] === code ? [] : [code]));

  const activeFilters = selectedCodes.length + (minRating > 0 ? 1 : 0);

  const header = (
    <View>
      <View className="rounded-[26px] bg-[#0E7490] p-5">
        <Text className="text-[10px] font-extrabold uppercase tracking-[1.8px] text-[#97EBF4]">
          Khám phá Việt Nam
        </Text>
        <Text className="mt-1 text-[24px] font-extrabold leading-[30px] text-white">
          Bạn muốn đi đâu?
        </Text>
        <View style={shadow.card} className="mt-4 flex-row items-center rounded-2xl bg-white px-3">
          <Icon name="travel-explore" size={21} color={colors.primary} />
          <TextInput
            value={searchText}
            onChangeText={(value) => {
              setSearchText(value);
              setSuggestionsOpen(true);
              if (province) setProvince(null);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            placeholder="Nhập tỉnh/thành, ví dụ: Đà Nẵng"
            placeholderTextColor="#91A2A1"
            style={{ flex: 1, height: 48, marginLeft: 8, fontSize: 13.5, color: colors.ink }}
          />
          {searchText ? (
            <Pressable onPress={clearProvince} hitSlop={8} accessibilityLabel="Xóa tỉnh đã chọn">
              <Icon name="close" size={18} color="#87918F" />
            </Pressable>
          ) : null}
        </View>
        {suggestionsOpen && suggestions.length > 0 ? (
          <View className="mt-2 rounded-2xl bg-white p-1.5">
            {suggestions.map((item) => (
              <Pressable
                key={item.code}
                onPress={() => chooseProvince(item)}
                className="flex-row items-center gap-2 rounded-xl px-3 py-2.5"
              >
                <Icon name="location-on" size={17} color={colors.primary} />
                <Text className="text-[13px] font-bold text-[#34575A]">{item.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {suggestionsOpen && fold(searchText) && suggestions.length === 0 && !province ? (
          <Text className="mt-2 text-[12px] text-white/85">
            Không tìm thấy tỉnh/thành phù hợp trong danh sách của hệ thống.
          </Text>
        ) : null}
        {!province && quickProvinces.length > 0 ? (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {quickProvinces.map((item) => (
              <Pressable
                key={item.code}
                onPress={() => chooseProvince(item)}
                className="rounded-full border border-white/35 px-3 py-1.5"
              >
                <Text className="text-[12px] font-bold text-white">{item.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {groups.length > 0 ? (
        <View className="mt-5">
          <Text className="mb-2 text-[16px] font-extrabold text-[#204346]">
            Điều gì khiến bạn hứng thú?
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {groups.map((group) => (
              <Chip
                key={group.code}
                label={group.name}
                icon={GROUP_ICONS[group.code] ?? 'category'}
                selected={selectedCodes.length === 1 && selectedCodes[0] === group.code}
                onPress={() => chooseGroup(group.code)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View className="mb-3 mt-5 flex-row items-center justify-between">
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-[18px] font-extrabold text-[#204346]">
            {province ? `Địa điểm tại ${province.name}` : 'Tất cả địa điểm'}
          </Text>
          <Text className="text-[12px] text-[#557080]">
            {loading ? 'Đang tải…' : `${visiblePlaces.length} / ${total} địa điểm`}
          </Text>
        </View>
        <ScalePressable
          scaleTo={0.94}
          onPress={() => setFiltersOpen(true)}
          className="flex-row items-center gap-1.5 rounded-xl border border-[#DEE8E3] bg-white px-3 py-2.5"
        >
          <Icon name="tune" size={18} color={colors.primaryStrong} />
          <Text className="text-[12.5px] font-bold text-[#0E7490]">Bộ lọc</Text>
          {activeFilters > 0 ? (
            <View className="rounded-full bg-[#0891B2] px-1.5">
              <Text className="text-[10px] font-bold text-white">{activeFilters}</Text>
            </View>
          ) : null}
        </ScalePressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={loading || loadError ? [] : visiblePlaces}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        renderItem={({ item, index }) => (
          <FadeInView delay={Math.min(index, 5) * 45} offset={10} duration={240}>
            <PlaceCard
              place={item}
              onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
            />
          </FadeInView>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          loading ? (
            <View className="gap-3.5">
              <PlaceCardSkeleton />
              <PlaceCardSkeleton />
              <PlaceCardSkeleton />
            </View>
          ) : loadError ? (
            <ErrorState message={loadError} onRetry={() => setRetry((n) => n + 1)} />
          ) : (
            <EmptyState
              title="Chưa tìm thấy điểm đến phù hợp"
              message="Thử bỏ bớt bộ lọc hoặc chọn tỉnh/thành khác."
              action={
                <Button
                  title="Khám phá tất cả"
                  variant="secondary"
                  onPress={() => {
                    clearProvince();
                    setSelectedCodes([]);
                    setMinRating(0);
                    setSortMode('default');
                  }}
                />
              }
            />
          )
        }
        ListFooterComponent={loadingMore ? <Loading label="Đang tải thêm…" /> : null}
      />

      <Sheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Tinh chỉnh trải nghiệm"
        footer={
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Đặt lại"
                variant="outline"
                onPress={() => {
                  setSelectedCodes([]);
                  setMinRating(0);
                  setSortMode('default');
                }}
              />
            </View>
            <View className="flex-1">
              <Button title="Xem kết quả" onPress={() => setFiltersOpen(false)} />
            </View>
          </View>
        }
      >
        <Text className="mb-2 text-[13px] font-extrabold text-[#355C58]">Sắp xếp</Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {SORTS.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              selected={sortMode === item.value}
              onPress={() => setSortMode(item.value)}
            />
          ))}
        </View>
        <Text className="mb-2 text-[13px] font-extrabold text-[#355C58]">Đánh giá tối thiểu</Text>
        <View className="mb-1 flex-row flex-wrap gap-2">
          {RATINGS.map((rating) => (
            <Chip
              key={rating}
              label={rating > 0 ? `${rating}+ sao` : 'Tất cả'}
              icon={rating > 0 ? 'star' : undefined}
              selected={minRating === rating}
              onPress={() => setMinRating(rating)}
            />
          ))}
        </View>
        <Text className="mb-4 text-[11px] text-[#90A39A]">
          Lọc đánh giá trên các địa điểm đã tải.
        </Text>
        <Text className="mb-2 text-[13px] font-extrabold text-[#355C58]">
          Loại hình trải nghiệm
        </Text>
        {groups.map((group) => (
          <View key={group.code} className="mb-3">
            <Text className="mb-1.5 text-[12px] font-bold text-[#557080]">{group.name}</Text>
            <View className="flex-row flex-wrap gap-2">
              {[group, ...group.subtypes].map((item) => (
                <Chip
                  key={item.code}
                  label={item.code === group.code ? `Tất cả ${group.name}` : item.name}
                  selected={selectedCodes.includes(item.code)}
                  onPress={() => toggleCode(item.code)}
                />
              ))}
            </View>
          </View>
        ))}
      </Sheet>
    </SafeAreaView>
  );
}
