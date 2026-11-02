import React, { useMemo, useState } from 'react';
import {
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomTabBar, {
  type AppTab,
} from '../../components/BottomTabBar';
import AppHeader from '../../components/AppHeader';

import {
  places,
  type CategoryId,
  type Place,
} from '../../constants/places';

// ==================== TYPES ====================

type SortMode = 'recent' | 'rating' | 'name';

type FavoritesScreenProps = {
  /** Danh sách id địa điểm đã lưu (thứ tự = thứ tự lưu) */
  favorites: string[];
  onToggleFavorite: (placeId: string) => void;
  onPlacePress?: (placeId: string) => void;
  onTabPress?: (tab: AppTab) => void;
  onCreateTrip?: (placeIds: string[]) => void;
};

// ==================== COLORS ====================

const COLORS = {
  primary: '#087A78',
  primaryDark: '#075C66',
  text: '#13364A',
  muted: '#72818C',
  background: '#F8F8FF',
  lightPurple: '#EBEDFF',
  star: '#E0A100',
  heart: '#E5484D',
  white: '#FFFFFF',
};

// ==================== FILTERS ====================

const categories: { id: CategoryId; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'nature', label: 'Danh lam thắng cảnh' },
  { id: 'culture', label: 'Văn hoá' },
  { id: 'food', label: 'Ẩm thực' },
  { id: 'shopping', label: 'Mua sắm' },
];

const sortOptions: { id: SortMode; label: string }[] = [
  { id: 'recent', label: 'Mới lưu gần đây' },
  { id: 'rating', label: 'Đánh giá cao nhất' },
  { id: 'name', label: 'Tên A - Z' },
];

// ==================== FAVORITE CARD ====================

function FavoriteCard({
  place,
  onRemove,
  onPress,
}: {
  place: Place;
  onRemove: () => void;
  onPress: () => void;
}) {
  return (
    <View className="mb-4 overflow-hidden rounded-[22px] bg-white">
      {/* Ảnh */}
      <Pressable onPress={onPress}>
        <ImageBackground
          source={{ uri: place.image }}
          style={{ height: 170, justifyContent: 'space-between' }}
        >
          <View className="flex-row justify-end p-3">
            <Pressable
              onPress={onRemove}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full bg-white"
              accessibilityRole="button"
              accessibilityLabel="Bỏ yêu thích"
            >
              <MaterialCommunityIcons
                name="heart"
                size={20}
                color={COLORS.heart}
              />
            </Pressable>
          </View>

          <View className="flex-row p-3">
            <View className="flex-row items-center rounded-full bg-black/50 px-2.5 py-1">
              <MaterialCommunityIcons
                name="map-marker"
                size={12}
                color="white"
              />
              <Text className="ml-1 text-[10px] font-bold text-white">
                {place.location}
              </Text>
            </View>
          </View>
        </ImageBackground>
      </Pressable>

      {/* Thông tin */}
      <View className="px-4 pb-4 pt-3">
        <View className="flex-row items-start">
          <View className="min-w-0 flex-1 pr-3">
            <Text
              numberOfLines={1}
              className="text-[16px] font-extrabold"
              style={{ color: COLORS.text }}
            >
              {place.name}
            </Text>

            <View className="mt-1 flex-row flex-wrap items-center">
              <MaterialCommunityIcons
                name="star"
                size={14}
                color={COLORS.star}
              />
              <Text
                className="ml-0.5 text-[11px] font-bold"
                style={{ color: COLORS.text }}
              >
                {place.rating}
              </Text>
              <Text
                className="ml-1 text-[11px]"
                style={{ color: COLORS.muted }}
              >
                ({place.reviews} đánh giá)
              </Text>
              <Text
                className="mx-1 text-[11px]"
                style={{ color: COLORS.muted }}
              >
                •
              </Text>
              <Text
                numberOfLines={1}
                className="text-[11px] font-semibold"
                style={{ color: COLORS.primary }}
              >
                {place.tag}
              </Text>
            </View>
          </View>

          <View className="items-end">
            <Text
              className="text-[10px]"
              style={{ color: COLORS.muted }}
            >
              Giá tham khảo
            </Text>
            <Text
              className="text-[15px] font-extrabold"
              style={{ color: '#C2410C' }}
            >
              {place.priceLabel}
            </Text>
          </View>
        </View>

        {/* Nút */}
        <Pressable
          onPress={onPress}
          className="mt-3 h-11 items-center justify-center rounded-2xl active:opacity-70"
          style={{ backgroundColor: COLORS.lightPurple }}
        >
          <Text
            className="text-[13px] font-bold"
            style={{ color: COLORS.text }}
          >
            Xem chi tiết
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ==================== MAIN SCREEN ====================

export default function FavoritesScreen({
  favorites,
  onToggleFavorite,
  onPlacePress,
  onTabPress,
  onCreateTrip,
}: FavoritesScreenProps) {
  const [category, setCategory] = useState<CategoryId>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');

  const showComingSoon = (title: string) => {
    Alert.alert(title, 'Chức năng đang được phát triển.');
  };

  const handleTabPress = (tab: AppTab) => {
    if (onTabPress) {
      onTabPress(tab);
    } else {
      showComingSoon('Điều hướng');
    }
  };

  // Địa điểm đã lưu, mới lưu nhất đứng đầu
  const savedPlaces = useMemo(
    () =>
      [...favorites]
        .reverse()
        .map((id) => places.find((place) => place.id === id))
        .filter((place): place is Place => Boolean(place)),
    [favorites]
  );

  const countByCategory = (id: CategoryId) =>
    id === 'all'
      ? savedPlaces.length
      : savedPlaces.filter((place) => place.category === id).length;

  const visiblePlaces = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    const filtered = savedPlaces.filter((place) => {
      const matchCategory =
        category === 'all' || place.category === category;
      const matchQuery =
        !keyword ||
        place.name.toLowerCase().includes(keyword) ||
        place.location.toLowerCase().includes(keyword);

      return matchCategory && matchQuery;
    });

    if (sortMode === 'rating') {
      return [...filtered].sort((a, b) => b.rating - a.rating);
    }
    if (sortMode === 'name') {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }
    return filtered;
  }, [savedPlaces, category, query, sortMode]);

  const currentSort = sortOptions.find((option) => option.id === sortMode)!;

  const cycleSort = () => {
    const index = sortOptions.findIndex((option) => option.id === sortMode);
    setSortMode(sortOptions[(index + 1) % sortOptions.length].id);
  };

  const handleRemove = (place: Place) => {
    Alert.alert(
      'Bỏ yêu thích',
      `Xoá "${place.name}" khỏi danh sách yêu thích?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: () => onToggleFavorite(place.id),
        },
      ]
    );
  };

  const handlePlacePress = (placeId: string) => {
    if (onPlacePress) {
      onPlacePress(placeId);
    } else {
      showComingSoon('Chi tiết địa điểm');
    }
  };

  const handleCreateTrip = () => {
    if (onCreateTrip) {
      onCreateTrip(savedPlaces.map((place) => place.id));
    } else {
      showComingSoon('Tạo chuyến đi');
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{ backgroundColor: COLORS.background }}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.white}
      />

      {/* ================= HEADER ================= */}

      <AppHeader
        onNotificationPress={() => showComingSoon('Thông báo')}
        onProfilePress={() => handleTabPress('profile')}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 15,
          paddingTop: 16,
          paddingBottom: 28,
        }}
      >
        {/* ================= TITLE ================= */}

        <View className="flex-row items-center">
          <View className="min-w-0 flex-1 flex-row flex-wrap items-baseline">
            <Text
              className="text-[22px] font-extrabold"
              style={{ color: COLORS.text }}
            >
              Địa điểm yêu thích
            </Text>
            <Text
              className="ml-2 text-[12px] font-semibold"
              style={{ color: COLORS.primary }}
            >
              ({savedPlaces.length} điểm đã lưu)
            </Text>
          </View>

          <Pressable
            onPress={() => {
              setShowSearch((previous) => !previous);
              setQuery('');
            }}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: COLORS.lightPurple }}
            accessibilityLabel="Tìm kiếm"
          >
            <MaterialCommunityIcons
              name={showSearch ? 'close' : 'magnify'}
              size={21}
              color={COLORS.text}
            />
          </Pressable>
        </View>

        {showSearch && (
          <View className="mt-3 h-11 flex-row items-center rounded-2xl bg-white px-3">
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={COLORS.muted}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              autoFocus
              placeholder="Tìm trong danh sách yêu thích..."
              placeholderTextColor="#9AA6AD"
              className="ml-2 flex-1 text-[13px]"
              style={{ color: COLORS.text }}
            />
          </View>
        )}

        {/* ================= SORT ================= */}

        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <MaterialCommunityIcons
              name="sort-variant"
              size={16}
              color={COLORS.muted}
            />
            <Text
              className="ml-1 text-[12px]"
              style={{ color: COLORS.muted }}
            >
              Sắp xếp:
            </Text>
          </View>

          <Pressable
            onPress={cycleSort}
            className="flex-row items-center rounded-full bg-white px-3 py-1.5"
          >
            <Text
              className="text-[12px] font-bold"
              style={{ color: COLORS.text }}
            >
              {currentSort.label}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={18}
              color={COLORS.text}
            />
          </Pressable>
        </View>

        {/* ================= CATEGORIES ================= */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        >
          {categories.map((item) => {
            const selected = item.id === category;
            const count = countByCategory(item.id);

            return (
              <Pressable
                key={item.id}
                onPress={() => setCategory(item.id)}
                className="rounded-full px-4 py-2"
                style={{
                  backgroundColor: selected
                    ? COLORS.primaryDark
                    : COLORS.white,
                }}
              >
                <Text
                  className="text-[12px] font-bold"
                  style={{
                    color: selected ? COLORS.white : COLORS.text,
                  }}
                >
                  {item.label} ({count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ================= LIST ================= */}

        <View className="mt-4">
          {visiblePlaces.map((place) => (
            <FavoriteCard
              key={place.id}
              place={place}
              onRemove={() => handleRemove(place)}
              onPress={() => handlePlacePress(place.id)}
            />
          ))}

          {visiblePlaces.length === 0 && (
            <View className="items-center rounded-[22px] bg-white px-6 py-10">
              <View
                className="h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: '#FFE4E4' }}
              >
                <MaterialCommunityIcons
                  name="heart-outline"
                  size={32}
                  color={COLORS.heart}
                />
              </View>

              <Text
                className="mt-3 text-[15px] font-extrabold"
                style={{ color: COLORS.text }}
              >
                {savedPlaces.length === 0
                  ? 'Chưa có địa điểm yêu thích'
                  : 'Không tìm thấy địa điểm phù hợp'}
              </Text>

              <Text
                className="mt-1 text-center text-[12px]"
                style={{ color: COLORS.muted }}
              >
                {savedPlaces.length === 0
                  ? 'Bấm vào biểu tượng trái tim ở màn Khám phá để lưu địa điểm.'
                  : 'Thử chọn danh mục khác hoặc đổi từ khoá tìm kiếm.'}
              </Text>

              {savedPlaces.length === 0 && (
                <Pressable
                  onPress={() => handleTabPress('explore')}
                  className="mt-4 rounded-2xl px-5 py-3"
                  style={{ backgroundColor: COLORS.primaryDark }}
                >
                  <Text className="text-[13px] font-bold text-white">
                    Khám phá ngay
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* ================= CREATE TRIP CTA ================= */}

        {savedPlaces.length > 0 && (
          <LinearGradient
            colors={['#E2FCF8', '#D6F0FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 22, padding: 16, marginTop: 4 }}
          >
            <View className="flex-row items-center">
              <View
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: COLORS.primaryDark }}
              >
                <MaterialCommunityIcons
                  name="rocket-launch-outline"
                  size={22}
                  color="white"
                />
              </View>

              <View className="ml-3 min-w-0 flex-1">
                <Text
                  className="text-[15px] font-extrabold"
                  style={{ color: COLORS.text }}
                >
                  Sẵn sàng lên đường?
                </Text>
                <Text
                  className="mt-0.5 text-[11px]"
                  style={{ color: '#5D7782' }}
                >
                  Bạn muốn kết hợp các điểm yêu thích này vào một lịch
                  trình thông minh?
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleCreateTrip}
              className="mt-3 h-11 flex-row items-center justify-center rounded-2xl active:opacity-80"
              style={{ backgroundColor: COLORS.primaryDark }}
            >
              <Text className="text-[13px] font-bold text-white">
                Tạo chuyến đi từ danh sách này
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={18}
                color="white"
                style={{ marginLeft: 6 }}
              />
            </Pressable>
          </LinearGradient>
        )}
      </ScrollView>

      {/* ================= BOTTOM NAVIGATION ================= */}

      <BottomTabBar activeTab="favorites" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}
