import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { Text, TextInput } from '../ui/Typography';
import { errorMessage } from '../api/http';
import { placesApi } from '../api/placesApi';
import type { PlaceSummary } from '../api/types';
import { useRootNav } from '../navigation/hooks';
import { colors, shadow } from '../theme';
import { Icon } from '../ui/Icon';

const PAGE_SIZE = 8;
const DEBOUNCE_MS = 300;

/**
 * Ô tìm địa điểm theo tên (GET /api/places?keyword=) — bản mobile của HomePlaceSearch:
 * không phân biệt dấu/hoa thường ("chua huong" → Chùa Hương), gợi ý ngay khi gõ, bấm để mở chi tiết.
 */
export default function PlaceSearch() {
  const navigation = useRootNav();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const keyword = query.trim();

  useEffect(() => {
    if (!keyword) {
      setResults([]);
      setTotal(0);
      setError('');
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError('');
    const timer = setTimeout(() => {
      placesApi
        .list({ keyword, page: 0, size: PAGE_SIZE })
        .then((result) => {
          if (!active) return;
          setResults(result.items);
          setTotal(result.total);
          setPage(0);
        })
        .catch((caught) => active && setError(errorMessage(caught)))
        .finally(() => active && setLoading(false));
    }, DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [keyword]);

  const loadMore = () => {
    const next = page + 1;
    setLoading(true);
    placesApi
      .list({ keyword, page: next, size: PAGE_SIZE })
      .then((result) => {
        setResults((current) => [...current, ...result.items]);
        setTotal(result.total);
        setPage(next);
      })
      .catch((caught) => setError(errorMessage(caught)))
      .finally(() => setLoading(false));
  };

  return (
    <View className="mt-4">
      <View
        style={shadow.card}
        className="flex-row items-center rounded-2xl bg-white px-3"
      >
        <Icon name="search" size={22} color={colors.primary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm địa điểm, ví dụ: Chùa Hương, Hồ Tây…"
          placeholderTextColor="#87918F"
          numberOfLines={1}
          returnKeyType="search"
          style={{ flex: 1, height: 48, marginLeft: 8, fontSize: 13.5, color: colors.ink }}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Xóa từ khóa">
            <Icon name="close" size={18} color="#87918F" />
          </Pressable>
        ) : null}
      </View>

      {keyword ? (
        <View style={shadow.raised} className="mt-2 rounded-2xl bg-white p-2">
          {error ? <Text className="px-3 py-4 text-center text-[12px] text-[#D83A48]">{error}</Text> : null}
          {!error && !loading && results.length === 0 ? (
            <Text className="px-3 py-4 text-center text-[12px] text-[#557080]">
              Không tìm thấy địa điểm nào có tên “{keyword}”.
            </Text>
          ) : null}
          {results.map((place) => (
            <Pressable
              key={place.id}
              onPress={() => navigation.navigate('PlaceDetail', { placeId: place.id })}
              className="flex-row items-center gap-3 rounded-xl px-2 py-2"
            >
              <View className="h-11 w-11 overflow-hidden rounded-lg bg-[#D8F1F5]">
                {place.coverUrl ? (
                  <Image source={{ uri: place.coverUrl }} style={{ width: '100%', height: '100%' }} />
                ) : null}
              </View>
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-[13px] font-bold text-[#0F2A3B]">
                  {place.name}
                </Text>
                <Text numberOfLines={1} className="text-[11px] text-[#557080]">
                  {[place.category?.name, place.province?.name].filter(Boolean).join(' · ') ||
                    place.address ||
                    'Địa điểm du lịch'}
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color="#B5BFC4" />
            </Pressable>
          ))}
          {loading ? (
            <View className="py-3">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}
          {!loading && results.length > 0 && results.length < total ? (
            <Pressable onPress={loadMore} className="mt-1 rounded-xl py-2">
              <Text className="text-center text-[12px] font-bold text-[#0891B2]">
                Xem thêm kết quả ({total - results.length})
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
