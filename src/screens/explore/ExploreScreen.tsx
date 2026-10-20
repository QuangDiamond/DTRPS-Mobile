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

import {
  places,
  type CategoryId,
  type IconName,
  type Place,
} from '../../constants/places';

import BottomTabBar, {
  type AppTab,
} from '../../components/BottomTabBar';

// ==================== TYPES ====================

export type { AppTab };

type UserMode = 'traveler' | 'partner';

type ViewMode = 'list' | 'grid';

type ExploreScreenProps = {
  onTabPress?: (tab: AppTab) => void;
  onPlacePress?: (placeId: string) => void;
  favorites?: string[];
  onToggleFavorite?: (placeId: string) => void;
};

// ==================== COLORS ====================

const COLORS = {
  primary: '#087A78',
  primaryDark: '#075C66',
  text: '#13364A',
  muted: '#72818C',
  background: '#F8F8FF',
  mint: '#C3F8F0',
  lightPurple: '#EBEDFF',
  star: '#E0A100',
  white: '#FFFFFF',
};

// ==================== MOCK DATA ====================

const categories: {
  id: CategoryId;
  label: string;
  icon?: IconName;
}[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'food', label: 'Ẩm thực', icon: 'food-outline' },
  { id: 'culture', label: 'Văn hoá', icon: 'bank-outline' },
  { id: 'nature', label: 'Thiên nhiên', icon: 'image-filter-hdr' },
  { id: 'shopping', label: 'Mua sắm', icon: 'shopping-outline' },
];

// ==================== PLACE CARD (LIST) ====================

function PlaceCard({
  place,
  favorite,
  onToggleFavorite,
  onPress,
}: {
  place: Place;
  favorite: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-[20px] bg-white active:opacity-90"
      style={{
        shadowColor: '#13364A',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }}
    >
      {/* Image */}
      <ImageBackground
        source={{ uri: place.image }}
        resizeMode="cover"
        style={{ height: 160, backgroundColor: '#CFE9E6' }}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.45)']}
          style={{
            flex: 1,
            padding: 10,
            justifyContent: 'space-between',
          }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-row items-center rounded-full bg-[#087A78]/90 px-2.5 py-1">
              <MaterialCommunityIcons
                name={place.tagIcon}
                size={12}
                color={COLORS.white}
              />
              <Text className="ml-1 text-[10px] font-bold text-white">
                {place.tag}
              </Text>
            </View>

            <Pressable
              onPress={onToggleFavorite}
              hitSlop={8}
              accessibilityLabel={
                favorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'
              }
              className="h-9 w-9 items-center justify-center rounded-full bg-white"
            >
              <MaterialCommunityIcons
                name={favorite ? 'heart' : 'heart-outline'}
                size={20}
                color={favorite ? '#D93B4A' : '#5C6B75'}
              />
            </Pressable>
          </View>

          <View className="flex-row items-center self-start rounded-full bg-black/40 px-2.5 py-1">
            <MaterialCommunityIcons
              name="map-marker"
              size={12}
              color={COLORS.white}
            />
            <Text className="ml-1 text-[11px] font-semibold text-white">
              {place.location}
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* Content */}
      <View className="px-3.5 pb-3.5 pt-3">
        <View className="flex-row items-center justify-between">
          <Text
            numberOfLines={1}
            className="mr-2 flex-1 text-[17px] font-extrabold"
            style={{ color: COLORS.text }}
          >
            {place.name}
          </Text>

          <View className="flex-row items-center rounded-full bg-[#FFF5DA] px-2 py-0.5">
            <MaterialCommunityIcons
              name="star"
              size={13}
              color={COLORS.star}
            />
            <Text className="ml-0.5 text-[11px] font-bold text-[#8A6100]">
              {place.rating}
            </Text>
            <Text className="ml-0.5 text-[10px] text-[#A8894A]">
              ({place.reviews})
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={2}
          className="mt-1 text-[12px] leading-[17px]"
          style={{ color: COLORS.muted }}
        >
          {place.description}
        </Text>

        <View className="mt-3 flex-row items-center justify-between">
          <View className="mr-2 flex-1 rounded-xl bg-[#F1F3FF] px-3 py-1.5">
            <Text className="text-[10px] text-[#7E8797]">
              Chi phí dự kiến
            </Text>
            <Text
              numberOfLines={1}
              className="text-[14px] font-extrabold"
              style={{ color: COLORS.primary }}
            >
              {place.priceLabel}
              {place.priceNote && (
                <Text className="text-[10px] font-medium text-[#7E8797]">
                  {place.priceNote}
                </Text>
              )}
            </Text>
          </View>

          <Pressable
            onPress={onPress}
            className="h-9 flex-row items-center rounded-full px-4 active:opacity-80"
            style={{ backgroundColor: '#A0F1E7' }}
          >
            <Text className="text-[13px] font-bold text-[#006D68]">
              Chi tiết
            </Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={16}
              color="#006D68"
              style={{ marginLeft: 4 }}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// ==================== PLACE CARD (GRID) ====================

function PlaceGridCard({
  place,
  favorite,
  onToggleFavorite,
  onPress,
}: {
  place: Place;
  favorite: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 overflow-hidden rounded-2xl bg-white active:opacity-90"
      style={{ width: '48.5%', elevation: 2 }}
    >
      <ImageBackground
        source={{ uri: place.image }}
        resizeMode="cover"
        style={{ height: 110, backgroundColor: '#CFE9E6' }}
      >
        <View className="flex-1 items-end p-2">
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={8}
            className="h-7 w-7 items-center justify-center rounded-full bg-white"
          >
            <MaterialCommunityIcons
              name={favorite ? 'heart' : 'heart-outline'}
              size={16}
              color={favorite ? '#D93B4A' : '#5C6B75'}
            />
          </Pressable>
        </View>
      </ImageBackground>

      <View className="p-2.5">
        <Text
          numberOfLines={1}
          className="text-[13px] font-extrabold"
          style={{ color: COLORS.text }}
        >
          {place.name}
        </Text>

        <View className="mt-0.5 flex-row items-center">
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={11}
            color={COLORS.muted}
          />
          <Text
            numberOfLines={1}
            className="ml-0.5 flex-1 text-[10px]"
            style={{ color: COLORS.muted }}
          >
            {place.location}
          </Text>
          <MaterialCommunityIcons
            name="star"
            size={11}
            color={COLORS.star}
          />
          <Text className="ml-0.5 text-[10px] font-bold text-[#8A6100]">
            {place.rating}
          </Text>
        </View>

        <Text
          numberOfLines={1}
          className="mt-1.5 text-[12px] font-extrabold"
          style={{ color: COLORS.primary }}
        >
          {place.priceLabel}
        </Text>
      </View>
    </Pressable>
  );
}

// ==================== MAIN SCREEN ====================

export default function ExploreScreen({
  onTabPress,
  onPlacePress,
  favorites: externalFavorites,
  onToggleFavorite,
}: ExploreScreenProps) {
  const [mode, setMode] = useState<UserMode>('traveler');
  const [language, setLanguage] = useState<'VI' | 'EN'>('VI');
  const [category, setCategory] = useState<CategoryId>('all');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [localFavorites, setLocalFavorites] = useState<string[]>([
    'ha-long',
  ]);

  // Ưu tiên danh sách yêu thích từ App để đồng bộ với màn Chi tiết
  const favorites = externalFavorites ?? localFavorites;

  const showComingSoon = (title: string) => {
    Alert.alert(title, 'Chức năng đang được phát triển.');
  };

  const handleTabPress = (tab: AppTab) => {
    if (tab === 'explore') return;

    if (onTabPress) {
      onTabPress(tab);
    } else {
      showComingSoon('Điều hướng');
    }
  };

  const handlePlacePress = (placeId: string) => {
    if (onPlacePress) {
      onPlacePress(placeId);
    } else {
      showComingSoon('Chi tiết địa điểm');
    }
  };

  const toggleFavorite = (placeId: string) => {
    if (onToggleFavorite) {
      onToggleFavorite(placeId);
      return;
    }

    setLocalFavorites((previous) =>
      previous.includes(placeId)
        ? previous.filter((id) => id !== placeId)
        : [...previous, placeId]
    );
  };

  // Lọc tạm trên dữ liệu mock (chưa có backend)
  const visiblePlaces = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return places.filter((place) => {
      const matchCategory =
        category === 'all' ||
        place.category === category ||
        (category === 'shopping' && place.category === 'food');

      const matchKeyword =
        !keyword ||
        place.name.toLowerCase().includes(keyword) ||
        place.location.toLowerCase().includes(keyword) ||
        place.tag.toLowerCase().includes(keyword);

      return matchCategory && matchKeyword;
    });
  }, [category, query]);

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

      <View className="h-[65px] flex-row items-center justify-between bg-white px-4">
        <View className="flex-row items-center">
          <View
            className="h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: '#5CACA7' }}
          >
            <MaterialCommunityIcons
              name="compass-outline"
              size={25}
              color="white"
            />
          </View>

          <View className="ml-2.5">
            <Text
              className="text-[19px] font-extrabold"
              style={{ color: '#518E88' }}
            >
              SmartTravel
            </Text>

            <Text
              className="text-[10px] font-extrabold tracking-[1px]"
              style={{ color: '#4FA6A1' }}
            >
              VIETNAM AI PLANNER
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          {/* Language switch */}
          <View className="flex-row rounded-full bg-[#EBEDFF] p-0.5">
            {(['VI', 'EN'] as const).map((lang) => {
              const selected = language === lang;

              return (
                <Pressable
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  className="rounded-full px-2 py-1"
                  style={{
                    backgroundColor: selected
                      ? COLORS.white
                      : 'transparent',
                  }}
                >
                  <Text
                    className="text-[10px] font-extrabold"
                    style={{
                      color: selected ? COLORS.primary : '#8C989E',
                    }}
                  >
                    {lang}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => handleTabPress('profile')}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: '#62AAA4' }}
          >
            <MaterialCommunityIcons
              name="account"
              size={22}
              color="white"
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={[1]}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ================= MODE SWITCH ================= */}

        <View className="px-4 pt-3">
          <View className="flex-row rounded-full bg-white p-1">
            {(
              [
                {
                  id: 'traveler',
                  label: 'Khách du lịch',
                  icon: 'account-group-outline',
                },
                {
                  id: 'partner',
                  label: 'Đối tác',
                  icon: 'storefront-outline',
                },
              ] as { id: UserMode; label: string; icon: IconName }[]
            ).map((item) => {
              const selected = mode === item.id;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setMode(item.id);
                    if (item.id === 'partner') {
                      showComingSoon('Chế độ Đối tác');
                    }
                  }}
                  className="h-9 flex-1 flex-row items-center justify-center rounded-full"
                  style={{
                    backgroundColor: selected
                      ? COLORS.mint
                      : 'transparent',
                  }}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={16}
                    color={selected ? COLORS.primary : '#7E8797'}
                  />
                  <Text
                    className="ml-1.5 text-[13px]"
                    style={{
                      color: selected ? COLORS.primaryDark : '#7E8797',
                      fontWeight: selected ? '800' : '600',
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ================= SEARCH + CATEGORIES (STICKY) ================= */}

        <View
          className="pb-2 pt-3"
          style={{ backgroundColor: COLORS.background }}
        >
          <View className="flex-row items-center px-4">
            <View className="h-12 flex-1 flex-row items-center rounded-full border border-[#E3E7F0] bg-white px-4">
              <MaterialCommunityIcons
                name="magnify"
                size={21}
                color="#7E8797"
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Tìm điểm đến, món ngon, danh lam..."
                placeholderTextColor="#9CA3AF"
                className="ml-2 flex-1 p-0 text-[13px]"
                style={{ color: COLORS.text }}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={18}
                    color="#A4ADC1"
                  />
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => showComingSoon('Bộ lọc nâng cao')}
              accessibilityLabel="Bộ lọc"
              className="ml-2.5 h-12 w-12 items-center justify-center rounded-2xl active:opacity-80"
              style={{ backgroundColor: COLORS.primary }}
            >
              <MaterialCommunityIcons
                name="tune-variant"
                size={22}
                color={COLORS.white}
              />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 12,
              gap: 8,
            }}
          >
            {categories.map((item) => {
              const selected = category === item.id;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => setCategory(item.id)}
                  className="h-9 flex-row items-center rounded-full px-4"
                  style={{
                    backgroundColor: selected
                      ? COLORS.primary
                      : COLORS.white,
                    borderWidth: selected ? 0 : 1,
                    borderColor: '#E3E7F0',
                  }}
                >
                  {item.icon && (
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={15}
                      color={selected ? COLORS.white : '#4A7091'}
                      style={{ marginRight: 5 }}
                    />
                  )}
                  <Text
                    className="text-[13px]"
                    style={{
                      color: selected ? COLORS.white : '#36546A',
                      fontWeight: selected ? '800' : '600',
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ================= RESULT INFO ================= */}

        <View className="mb-3 mt-1 flex-row items-center justify-between px-4">
          <View className="flex-1 flex-row items-center">
            <MaterialCommunityIcons
              name="map-search-outline"
              size={15}
              color={COLORS.primary}
            />
            <Text
              numberOfLines={1}
              className="ml-1.5 flex-1 text-[11px]"
              style={{ color: COLORS.muted }}
            >
              Tìm thấy{' '}
              <Text className="font-extrabold" style={{ color: COLORS.text }}>
                {category === 'all' && !query ? 128 : visiblePlaces.length}
              </Text>{' '}
              địa điểm tuyệt vời tại Việt Nam
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            {(
              [
                { id: 'list', icon: 'view-agenda-outline' },
                { id: 'grid', icon: 'view-grid-outline' },
              ] as { id: ViewMode; icon: IconName }[]
            ).map((item) => {
              const selected = viewMode === item.id;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => setViewMode(item.id)}
                  className="h-8 w-8 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: selected
                      ? COLORS.mint
                      : 'transparent',
                  }}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={18}
                    color={selected ? COLORS.primary : '#8C989E'}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ================= PLACE LIST ================= */}

        <View className="px-4">
          {visiblePlaces.length === 0 ? (
            <View className="items-center rounded-[20px] bg-white px-6 py-10">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#C3F8F0]">
                <MaterialCommunityIcons
                  name="map-marker-question-outline"
                  size={32}
                  color={COLORS.primary}
                />
              </View>
              <Text
                className="mt-3 text-[15px] font-bold"
                style={{ color: COLORS.text }}
              >
                Không tìm thấy địa điểm
              </Text>
              <Text
                className="mt-1 text-center text-[12px]"
                style={{ color: COLORS.muted }}
              >
                Thử từ khoá khác hoặc chọn danh mục khác nhé.
              </Text>
            </View>
          ) : viewMode === 'list' ? (
            visiblePlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                favorite={favorites.includes(place.id)}
                onToggleFavorite={() => toggleFavorite(place.id)}
                onPress={() => handlePlacePress(place.id)}
              />
            ))
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {visiblePlaces.map((place) => (
                <PlaceGridCard
                  key={place.id}
                  place={place}
                  favorite={favorites.includes(place.id)}
                  onToggleFavorite={() => toggleFavorite(place.id)}
                  onPress={() => handlePlacePress(place.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ================= BOTTOM NAVIGATION ================= */}

      <BottomTabBar activeTab="explore" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}
