
import React, { useRef, useState } from 'react';
import {
  Alert,
  GestureResponderEvent,
  Pressable,
  ScrollView,
  Share,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ================= TYPES =================

type IconName =
  React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type Region = 'all' | 'north' | 'central' | 'south';

type Category =
  | 'culture'
  | 'food'
  | 'beach'
  | 'adventure'
  | 'shopping'
  | 'art';

type PriceTier =
  | 'free'
  | 'budget'
  | 'mid'
  | 'premium'
  | 'custom';

export type SearchFilters = {
  region: Region;
  destinationQuery: string;
  categories: Category[];
  maxPrice: number;
  priceTier: PriceTier;
  minRating: 0 | 3.5 | 4 | 4.5;
  distanceKm: 5 | 15 | 30 | null;
  openNow: boolean;
  parking: boolean;
  familyFriendly: boolean;
};

type SearchFilterScreenProps = {
  onBack?: () => void;
  onApplyFilters?: (filters: SearchFilters) => void;
  onProfilePress?: () => void;
};

// ================= COLORS =================

const COLORS = {
  primary: '#007B73',
  primaryDark: '#006D65',
  title: '#16394D',
  muted: '#8292A7',
  background: '#F8F7FF',
  soft: '#F0F1FF',
  mint: '#96EDE3',
  border: '#EBEDF6',
  white: '#FFFFFF',
};

const MAX_PRICE = 2500000;

// ================= MOCK DATA =================

const INITIAL_FILTERS: SearchFilters = {
  region: 'all',
  destinationQuery: '',
  categories: ['culture', 'food'],
  maxPrice: 1200000,
  priceTier: 'mid',
  minRating: 4.5,
  distanceKm: 15,
  openNow: true,
  parking: false,
  familyFriendly: true,
};

const REGIONS: {
  id: Region;
  title: string;
  subtitle: string;
}[] = [
  {
    id: 'all',
    title: 'Tất cả Việt Nam',
    subtitle: '63 tỉnh thành phố',
  },
  {
    id: 'north',
    title: 'Miền Bắc',
    subtitle: 'Hà Nội, Hạ Long, Sa Pa',
  },
  {
    id: 'central',
    title: 'Miền Trung',
    subtitle: 'Đà Nẵng, Hội An, Huế',
  },
  {
    id: 'south',
    title: 'Miền Nam',
    subtitle: 'Sài Gòn, Phú Quốc, Cần Thơ',
  },
];

const CATEGORIES: {
  id: Category;
  title: string;
  icon: IconName;
}[] = [
  {
    id: 'culture',
    title: 'Văn hóa & Lịch sử',
    icon: 'bank-outline',
  },
  {
    id: 'food',
    title: 'Ẩm thực truyền thống',
    icon: 'food-fork-drink',
  },
  {
    id: 'beach',
    title: 'Bãi biển & Nghỉ dưỡng',
    icon: 'beach',
  },
  {
    id: 'adventure',
    title: 'Leo núi & Thiên nhiên',
    icon: 'hiking',
  },
  {
    id: 'shopping',
    title: 'Chợ & Mua sắm',
    icon: 'shopping-outline',
  },
  {
    id: 'art',
    title: 'Nghệ thuật & Check-in',
    icon: 'camera-outline',
  },
];

const PRICE_TIERS: {
  id: PriceTier;
  title: string;
  price: number;
}[] = [
  { id: 'free', title: 'Miễn phí (0đ)', price: 0 },
  {
    id: 'budget',
    title: 'Bình dân (< 500k)',
    price: 500000,
  },
  {
    id: 'mid',
    title: 'Tầm trung (500k - 1tr)',
    price: 1200000,
  },
  {
    id: 'premium',
    title: 'Cao cấp (> 1tr)',
    price: MAX_PRICE,
  },
];

// ================= HELPERS =================

function formatPrice(value: number) {
  return value
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function FilterSection({
                         icon,
                         title,
                         rightText,
                         children,
                       }: {
  icon: IconName;
  title: string;
  rightText?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4 rounded-[20px] bg-white px-4 py-4">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="min-w-0 flex-1 flex-row items-center">
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={COLORS.primary}
          />

          <Text
            className="ml-2 text-[15px] font-extrabold"
            style={{ color: COLORS.title }}
          >
            {title}
          </Text>
        </View>

        {rightText && (
          <Text
            className="ml-1 rounded-full bg-[#F1F2FF] px-2 py-1 text-[10px] font-semibold"
            style={{ color: COLORS.primary }}
          >
            {rightText}
          </Text>
        )}
      </View>

      {children}
    </View>
  );
}

// ================= SELECT BUTTON =================

function SelectButton({
                        title,
                        selected,
                        onPress,
                        style,
                      }: {
  title: string;
  selected: boolean;
  onPress: () => void;
  style?: object;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="min-h-[43px] items-center justify-center rounded-xl px-2 py-2"
      style={[
        {
          backgroundColor: selected
            ? COLORS.mint
            : COLORS.soft,
        },
        style,
      ]}
    >
      <Text
        className="text-center text-[11px] font-bold"
        style={{
          color: selected
            ? COLORS.primaryDark
            : '#455672',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

// ================= MAIN SCREEN =================

export default function SearchFilterScreen({
                                             onBack,
                                             onApplyFilters,
                                             onProfilePress,
                                           }: SearchFilterScreenProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    ...INITIAL_FILTERS,
    categories: [...INITIAL_FILTERS.categories],
  });

  const trackWidth = useRef(1);

  const updateFilters = (
    changes: Partial<SearchFilters>
  ) => {
    setFilters(previous => ({
      ...previous,
      ...changes,
    }));
  };

  const resetFilters = () => {
    setFilters({
      ...INITIAL_FILTERS,
      categories: [...INITIAL_FILTERS.categories],
    });
  };

  const toggleCategory = (category: Category) => {
    setFilters(previous => {
      const selected = previous.categories.includes(category);

      return {
        ...previous,
        categories: selected
          ? previous.categories.filter(
            item => item !== category
          )
          : [...previous.categories, category],
      };
    });
  };

  // ================= PRICE SLIDER =================

  const pricePercentage =
    (filters.maxPrice / MAX_PRICE) * 100;

  const updatePriceByTouch = (
    event: GestureResponderEvent
  ) => {
    const x = event.nativeEvent.locationX;

    const ratio = Math.max(
      0,
      Math.min(1, x / trackWidth.current)
    );

    const roundedPrice =
      Math.round((ratio * MAX_PRICE) / 100000) *
      100000;

    updateFilters({
      maxPrice: roundedPrice,
      priceTier: 'custom',
    });
  };

  // ================= APPLY FILTERS =================

  const handleApplyFilters = () => {
    if (onApplyFilters) {
      onApplyFilters(filters);
    } else {
      Alert.alert(
        'Bộ lọc tìm kiếm',
        'Đã chọn bộ lọc mẫu. Chức năng lọc danh sách địa điểm sẽ được kết nối sau.'
      );
    }
  };

  // ================= RENDER =================

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{
        backgroundColor: COLORS.background,
      }}
    >
      <StatusBar style="dark" />

      {/* ================= HEADER ================= */}

      <View className="h-[58px] flex-row items-center justify-between border-b border-[#ECEEF4] bg-white px-4">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => onBack?.()}
            className="mr-3 h-9 w-9 items-center justify-center"
            accessibilityLabel="Quay lại"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#3E5569"
            />
          </Pressable>

          <Text
            className="text-[16px] font-bold"
            style={{ color: COLORS.title }}
          >
            Bộ Lọc Tìm Kiếm
          </Text>
        </View>

        <View className="flex-row items-center">
          <Pressable
            onPress={() => {
              void Share.share({
                message:
                  'Khám phá điểm đến cùng SmartTravel!',
              });
            }}
            className="mr-3 h-9 w-9 items-center justify-center"
          >
            <MaterialCommunityIcons
              name="share-variant-outline"
              size={21}
              color="#526C80"
            />
          </Pressable>

          <Pressable
            onPress={() => onProfilePress?.()}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: COLORS.primary }}
          >
            <MaterialCommunityIcons
              name="account"
              size={21}
              color="white"
            />
          </Pressable>
        </View>
      </View>

      {/* ================= SCROLL CONTENT ================= */}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: 14,
          paddingBottom: 24,
        }}
      >
        {/* ================= TITLE ================= */}

        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <MaterialCommunityIcons
              name="tune-variant"
              size={21}
              color={COLORS.primary}
            />

            <Text
              className="ml-2 text-[19px] font-extrabold"
              style={{ color: COLORS.title }}
            >
              Bộ Lọc Tìm Kiếm
            </Text>
          </View>

          <Pressable
            onPress={resetFilters}
            className="flex-row items-center rounded-full bg-[#EFEFFC] px-3 py-2"
          >
            <MaterialCommunityIcons
              name="refresh"
              size={15}
              color={COLORS.primary}
            />

            <Text
              className="ml-1 text-[11px] font-bold"
              style={{ color: COLORS.primary }}
            >
              Đặt lại bộ lọc
            </Text>
          </Pressable>
        </View>

        {/* ================= AI HINT ================= */}

        <View className="mb-4 flex-row items-center rounded-2xl bg-[#F0F1FF] px-3 py-3.5">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-white">
            <MaterialCommunityIcons
              name="magnify-scan"
              size={24}
              color={COLORS.primary}
            />
          </View>

          <View className="min-w-0 flex-1">
            <Text
              className="text-[11px] font-extrabold tracking-[0.5px]"
              style={{ color: COLORS.primary }}
            >
              BỘ LỌC THÔNG MINH AI
            </Text>

            <Text
              className="mt-1 text-[11px]"
              style={{ color: '#6E829B' }}
              numberOfLines={2}
            >
              Tự động gợi ý kết quả điểm tham quan phù hợp
            </Text>
          </View>

          <MaterialCommunityIcons
            name="auto-fix"
            size={21}
            color="#C78A19"
          />
        </View>

        {/* ================= REGION ================= */}

        <FilterSection
          icon="map-marker-outline"
          title="Vùng miền & Điểm đến"
          rightText="Chọn 1"
        >
          <View className="flex-row flex-wrap justify-between">
            {REGIONS.map(region => {
              const selected =
                filters.region === region.id;

              return (
                <Pressable
                  key={region.id}
                  onPress={() =>
                    updateFilters({ region: region.id })
                  }
                  className="mb-2 rounded-xl p-3"
                  style={{
                    width: '49%',
                    minHeight: 78,
                    backgroundColor: selected
                      ? COLORS.mint
                      : COLORS.soft,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="flex-1 text-[13px] font-extrabold"
                      style={{
                        color: selected
                          ? COLORS.primaryDark
                          : COLORS.title,
                      }}
                    >
                      {region.title}
                    </Text>

                    {selected && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={17}
                        color={COLORS.primary}
                      />
                    )}
                  </View>

                  <Text
                    className="mt-1.5 text-[10px] leading-[15px]"
                    style={{
                      color: selected
                        ? '#217F79'
                        : '#8190AA',
                    }}
                  >
                    {region.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-2 flex-row items-center rounded-xl bg-[#F1F2FF] px-3">
            <MaterialCommunityIcons
              name="magnify"
              size={19}
              color="#8E9BB3"
            />

            <TextInput
              className="ml-2 h-12 flex-1 text-[12px]"
              style={{ color: COLORS.title }}
              placeholder="Tìm tỉnh/thành phố, quận huyện cụ thể..."
              placeholderTextColor="#9BA7BA"
              value={filters.destinationQuery}
              onChangeText={value =>
                updateFilters({
                  destinationQuery: value,
                })
              }
            />
          </View>
        </FilterSection>

        {/* ================= CATEGORIES ================= */}

        <FilterSection
          icon="shape-outline"
          title="Danh mục trải nghiệm"
          rightText="Đa chọn"
        >
          <View className="flex-row flex-wrap">
            {CATEGORIES.map(category => {
              const selected =
                filters.categories.includes(category.id);

              return (
                <Pressable
                  key={category.id}
                  onPress={() =>
                    toggleCategory(category.id)
                  }
                  className="mb-2 mr-2 flex-row items-center rounded-full px-3 py-2.5"
                  style={{
                    backgroundColor: selected
                      ? COLORS.mint
                      : COLORS.soft,
                  }}
                >
                  <MaterialCommunityIcons
                    name={category.icon}
                    size={17}
                    color={
                      selected
                        ? COLORS.primaryDark
                        : '#57708D'
                    }
                  />

                  <Text
                    className="ml-2 text-[12px] font-bold"
                    style={{
                      color: selected
                        ? COLORS.primaryDark
                        : '#405873',
                    }}
                  >
                    {category.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </FilterSection>

        {/* ================= PRICE ================= */}

        <FilterSection
          icon="cash-multiple"
          title="Khoảng giá dự kiến"
          rightText={`0 đ - ${formatPrice(
            filters.maxPrice
          )} đ`}
        >
          {/* Thanh điều chỉnh giá */}

          <View
            className="h-[35px] justify-center"
            onLayout={event => {
              trackWidth.current =
                event.nativeEvent.layout.width;
            }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={updatePriceByTouch}
            onResponderMove={updatePriceByTouch}
            accessibilityLabel="Điều chỉnh khoảng giá tối đa"
          >
            <View
              pointerEvents="none"
              className="h-[7px] rounded-full bg-[#DFE4E9]"
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${pricePercentage}%`,
                  backgroundColor: COLORS.primary,
                }}
              />
            </View>

            <View
              pointerEvents="none"
              className="absolute h-5 w-5 rounded-full border-[3px] border-white"
              style={{
                left: `${pricePercentage}%`,
                marginLeft: -10,
                top: 7,
                backgroundColor: COLORS.primary,
                elevation: 3,
              }}
            />
          </View>

          <View className="mb-3 flex-row justify-between">
            <Text className="text-[10px] text-[#8494A7]">
              0 đ
            </Text>
            <Text className="text-[10px] font-semibold text-[#668198]">
              1.000.000 đ
            </Text>
            <Text className="text-[10px] text-[#8494A7]">
              2.500.000+ đ
            </Text>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {PRICE_TIERS.map(tier => (
              <SelectButton
                key={tier.id}
                title={tier.title}
                selected={
                  filters.priceTier === tier.id
                }
                style={{
                  width: '49%',
                  marginBottom: 8,
                }}
                onPress={() =>
                  updateFilters({
                    priceTier: tier.id,
                    maxPrice: tier.price,
                  })
                }
              />
            ))}
          </View>
        </FilterSection>

        {/* ================= RATING ================= */}

        <FilterSection
          icon="star-outline"
          title="Đánh giá chất lượng"
        >
          <View className="flex-row flex-wrap justify-between">
            {[
              { label: 'Tất cả', value: 0 },
              { label: '⭐ 4.5+ Tuyệt vời', value: 4.5 },
              { label: '⭐ 4.0+ Rất tốt', value: 4 },
              { label: '⭐ 3.5+ Tốt', value: 3.5 },
            ].map(item => (
              <SelectButton
                key={item.value}
                title={item.label}
                selected={
                  filters.minRating === item.value
                }
                style={{
                  width: '49%',
                  marginBottom: 8,
                }}
                onPress={() =>
                  updateFilters({
                    minRating:
                      item.value as SearchFilters['minRating'],
                  })
                }
              />
            ))}
          </View>
        </FilterSection>

        {/* ================= DISTANCE ================= */}

        <FilterSection
          icon="navigation-variant-outline"
          title="Khoảng cách từ bạn"
        >
          <View className="flex-row justify-between">
            {[
              { label: '< 5 km', value: 5 },
              { label: '< 15 km', value: 15 },
              { label: '< 30 km', value: 30 },
              { label: 'Toàn tỉnh', value: null },
            ].map(item => (
              <SelectButton
                key={item.label}
                title={item.label}
                selected={
                  filters.distanceKm === item.value
                }
                style={{ width: '24%' }}
                onPress={() =>
                  updateFilters({
                    distanceKm:
                      item.value as SearchFilters['distanceKm'],
                  })
                }
              />
            ))}
          </View>
        </FilterSection>

        {/* ================= UTILITIES ================= */}

        <FilterSection
          icon="shield-check-outline"
          title="Tiện ích & Trạng thái"
        >
          <View className="flex-row items-center py-2">
            <MaterialCommunityIcons
              name="clock-outline"
              size={20}
              color={COLORS.primary}
            />

            <Text
              className="ml-2 flex-1 text-[12px] font-semibold"
              style={{ color: COLORS.title }}
            >
              Đang mở cửa ngay bây giờ
            </Text>

            <Switch
              value={filters.openNow}
              onValueChange={value =>
                updateFilters({ openNow: value })
              }
              trackColor={{
                false: '#E0E4F9',
                true: COLORS.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View className="flex-row items-center py-2">
            <MaterialCommunityIcons
              name="car-outline"
              size={20}
              color={COLORS.primary}
            />

            <Text
              className="ml-2 flex-1 text-[12px] font-semibold"
              style={{ color: COLORS.title }}
            >
              Có bãi đỗ xe ô tô / xe máy
            </Text>

            <Switch
              value={filters.parking}
              onValueChange={value =>
                updateFilters({ parking: value })
              }
              trackColor={{
                false: '#E0E4F9',
                true: COLORS.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View className="flex-row items-center py-2">
            <MaterialCommunityIcons
              name="account-group-outline"
              size={20}
              color={COLORS.primary}
            />

            <Text
              className="ml-2 flex-1 text-[12px] font-semibold"
              style={{ color: COLORS.title }}
            >
              Phù hợp gia đình & trẻ nhỏ
            </Text>

            <Switch
              value={filters.familyFriendly}
              onValueChange={value =>
                updateFilters({ familyFriendly: value })
              }
              trackColor={{
                false: '#E0E4F9',
                true: COLORS.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </FilterSection>

        {/* ================= SUGGESTIONS ================= */}

        <View className="mb-3 rounded-[20px] bg-[#F0F1FF] px-4 py-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text
              className="text-[13px] font-extrabold"
              style={{ color: COLORS.title }}
            >
              Gợi ý tìm kiếm nhanh
            </Text>

            <Pressable onPress={resetFilters}>
              <Text
                className="text-[10px] font-semibold"
                style={{ color: COLORS.primary }}
              >
                Xem tất cả
              </Text>
            </Pressable>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() =>
                updateFilters({
                  region: 'north',
                  destinationQuery: 'Vịnh Hạ Long',
                })
              }
              className="flex-1 flex-row items-center rounded-xl bg-white p-2"
            >
              <View className="mr-2 h-10 w-10 items-center justify-center rounded-lg bg-[#C8F1F0]">
                <Text className="text-[23px]">🏝️</Text>
              </View>

              <View className="min-w-0 flex-1">
                <Text
                  className="text-[11px] font-bold text-[#164155]"
                  numberOfLines={1}
                >
                  Vịnh Hạ Long
                </Text>

                <Text className="text-[9px] text-[#8295A9]">
                  124 điểm đến
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() =>
                updateFilters({
                  region: 'central',
                  destinationQuery: 'Phố cổ Hội An',
                })
              }
              className="flex-1 flex-row items-center rounded-xl bg-white p-2"
            >
              <View className="mr-2 h-10 w-10 items-center justify-center rounded-lg bg-[#FFE7B6]">
                <Text className="text-[23px]">🏮</Text>
              </View>

              <View className="min-w-0 flex-1">
                <Text
                  className="text-[11px] font-bold text-[#164155]"
                  numberOfLines={1}
                >
                  Phố cổ Hội An
                </Text>

                <Text className="text-[9px] text-[#8295A9]">
                  256 điểm đến
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* ================= FIXED BOTTOM BAR ================= */}

      <View className="flex-row items-center border-t border-[#ECEEF4] bg-white px-4 py-3">
        <Pressable
          onPress={resetFilters}
          className="mr-3 h-[52px] w-[52px] items-center justify-center rounded-full bg-[#F0F1FF]"
          accessibilityLabel="Xóa bộ lọc"
        >
          <MaterialCommunityIcons
            name="filter-variant"
            size={23}
            color="#6B7D9D"
          />
        </Pressable>

        <Pressable
          onPress={handleApplyFilters}
          className="h-[52px] flex-1 flex-row items-center justify-center rounded-full px-3"
          style={{
            backgroundColor: COLORS.primary,
            elevation: 3,
          }}
        >
          <Text
            className="flex-shrink text-center text-[13px] font-extrabold text-white"
            numberOfLines={1}
          >
            Áp dụng bộ lọc (Xem 48 kết quả)
          </Text>

          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color="white"
            style={{ marginLeft: 6 }}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
