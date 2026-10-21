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
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  formatDistance,
  nearbyCategories,
  nearbyPlaces,
  type NearbyCategory,
  type NearbyPlace,
} from '../../constants/nearbyPlaces';

// ==================== TYPES ====================

type TimeSlotId = 'morning' | 'afternoon' | 'evening';

export type InsertPosition = {
  day: number;
  slot: TimeSlotId;
};

type AddLocationScreenProps = {
  tripTitle?: string;
  /** Số ngày của chuyến đi, vd 4 */
  tripDays?: number;
  tripDuration?: string;
  onBack: () => void;
  /** Gọi khi bấm Xong, trả về các địa điểm đã thêm và vị trí chèn */
  onDone?: (placeIds: string[], position: InsertPosition) => void;
};

// ==================== COLORS ====================

const COLORS = {
  primary: '#087A78',
  primaryDark: '#075C66',
  text: '#13364A',
  muted: '#72818C',
  background: '#F8F8FF',
  lightPurple: '#EBEDFF',
  mint: '#C3F8F0',
  star: '#E0A100',
  white: '#FFFFFF',
};

const timeSlots: { id: TimeSlotId; label: string; time: string }[] = [
  { id: 'morning', label: 'Sáng', time: '09:00' },
  { id: 'afternoon', label: 'Chiều', time: '14:00 (Sau bữa trưa)' },
  { id: 'evening', label: 'Tối', time: '19:00 (Sau bữa tối)' },
];

// ==================== PLACE CARD ====================

function NearbyPlaceCard({
  place,
  day,
  added,
  onToggle,
}: {
  place: NearbyPlace;
  day: number;
  added: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="mb-4 overflow-hidden rounded-[22px] bg-white">
      <ImageBackground
        source={{ uri: place.image }}
        style={{
          height: 150,
          padding: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <View className="flex-row items-center rounded-full bg-black/55 px-2.5 py-1">
          <MaterialCommunityIcons name="navigation-variant" size={12} color="white" />
          <Text className="ml-1 text-[10px] font-bold text-white">
            Cách {formatDistance(place.distance)}
          </Text>
        </View>

        <View className="flex-row items-center rounded-full bg-white px-2.5 py-1">
          <MaterialCommunityIcons name="star" size={12} color={COLORS.star} />
          <Text className="ml-0.5 text-[10px] font-bold" style={{ color: COLORS.text }}>
            {place.rating}
          </Text>
          <Text className="ml-0.5 text-[10px]" style={{ color: COLORS.muted }}>
            ({place.reviews})
          </Text>
        </View>
      </ImageBackground>

      <View className="px-4 pb-4 pt-3">
        <Text
          numberOfLines={2}
          className="text-[15px] font-extrabold"
          style={{ color: COLORS.text }}
        >
          {place.name}
        </Text>

        <View className="mt-1.5 flex-row items-center">
          <MaterialCommunityIcons name={place.categoryIcon} size={14} color={COLORS.muted} />
          <Text className="ml-1 text-[11px]" style={{ color: COLORS.muted }}>
            {place.categoryLabel}
          </Text>
          <MaterialCommunityIcons
            name="clock-outline"
            size={13}
            color={COLORS.muted}
            style={{ marginLeft: 10 }}
          />
          <Text className="ml-1 text-[11px]" style={{ color: COLORS.muted }}>
            {place.duration}
          </Text>
        </View>

        <View className="mt-1 flex-row items-center">
          <MaterialCommunityIcons name="ticket-outline" size={14} color={COLORS.primary} />
          <Text className="ml-1 text-[11px] font-bold" style={{ color: COLORS.primary }}>
            {place.price}
          </Text>
        </View>

        <View className="mt-3 flex-row items-center">
          <Text
            numberOfLines={2}
            className="min-w-0 flex-1 pr-2 text-[11px] italic"
            style={{ color: COLORS.muted }}
          >
            {place.note}
          </Text>

          <Pressable
            onPress={onToggle}
            className="h-10 flex-row items-center rounded-full px-4 active:opacity-80"
            style={{
              backgroundColor: added ? COLORS.mint : COLORS.primaryDark,
            }}
            accessibilityLabel={added ? 'Bỏ khỏi lịch trình' : `Thêm vào Ngày ${day}`}
          >
            <MaterialCommunityIcons
              name={added ? 'check' : 'plus'}
              size={16}
              color={added ? COLORS.primaryDark : 'white'}
            />
            <Text
              className="ml-1 text-[12px] font-bold"
              style={{ color: added ? COLORS.primaryDark : 'white' }}
            >
              {added ? 'Đã thêm' : `Thêm vào Ngày ${day}`}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ==================== MAIN SCREEN ====================

export default function AddLocationScreen({
  tripTitle = 'Đà Nẵng — Hội An',
  tripDays = 4,
  tripDuration = '4N3Đ',
  onBack,
  onDone,
}: AddLocationScreenProps) {
  const [position, setPosition] = useState<InsertPosition>({
    day: 1,
    slot: 'afternoon',
  });
  const [showPicker, setShowPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<NearbyCategory>('nearest');
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const currentSlot = timeSlots.find((slot) => slot.id === position.slot)!;

  const showComingSoon = (title: string) => {
    Alert.alert(title, 'Chức năng đang được phát triển.');
  };

  const visiblePlaces = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('vi');

    const filtered = nearbyPlaces.filter((place) => {
      const matchCategory =
        category === 'nearest' || place.category === category;
      const matchQuery =
        !keyword ||
        `${place.name} ${place.categoryLabel}`
          .toLocaleLowerCase('vi')
          .includes(keyword);
      return matchCategory && matchQuery;
    });

    // "Gần đây nhất" sắp xếp theo khoảng cách
    return category === 'nearest'
      ? [...filtered].sort((a, b) => a.distance - b.distance)
      : filtered;
  }, [query, category]);

  const togglePlace = (placeId: string) => {
    setAddedIds((previous) =>
      previous.includes(placeId)
        ? previous.filter((id) => id !== placeId)
        : [...previous, placeId]
    );
  };

  const handleBack = () => {
    if (addedIds.length === 0) {
      onBack();
      return;
    }

    Alert.alert(
      'Bỏ địa điểm đã chọn?',
      `Bạn đã chọn ${addedIds.length} địa điểm nhưng chưa lưu vào lịch trình.`,
      [
        { text: 'Ở lại', style: 'cancel' },
        { text: 'Bỏ chọn', style: 'destructive', onPress: onBack },
      ]
    );
  };

  const handleDone = () => {
    if (onDone) {
      onDone(addedIds, position);
      return;
    }

    Alert.alert(
      'Đã cập nhật lịch trình',
      `Đã thêm ${addedIds.length} địa điểm vào Ngày ${position.day} – ${currentSlot.label}.`,
      [{ text: 'OK', onPress: onBack }]
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{ backgroundColor: COLORS.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* ================= HEADER ================= */}

      <View className="h-[58px] flex-row items-center justify-between bg-white px-3">
        <View className="flex-row items-center">
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full"
            accessibilityLabel="Quay lại"
          >
            <MaterialCommunityIcons name="arrow-left" size={23} color={COLORS.text} />
          </Pressable>
          <Text className="ml-1 text-[17px] font-extrabold" style={{ color: COLORS.text }}>
            Thêm địa điểm
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => showComingSoon('Chia sẻ lịch trình')} hitSlop={6}>
            <MaterialCommunityIcons name="share-variant-outline" size={21} color={COLORS.muted} />
          </Pressable>
          <Pressable onPress={() => showComingSoon('Lưu lịch trình')} hitSlop={6}>
            <MaterialCommunityIcons name="bookmark-outline" size={22} color={COLORS.muted} />
          </Pressable>
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: COLORS.primaryDark }}
          >
            <MaterialCommunityIcons name="account" size={19} color="white" />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 15,
          paddingTop: 14,
          paddingBottom: addedIds.length > 0 ? 100 : 28,
        }}
      >
        {/* ================= TRIP CONTEXT ================= */}

        <View className="rounded-[20px] p-3.5" style={{ backgroundColor: '#E7F8F5' }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <MaterialCommunityIcons
                name="calendar-edit"
                size={14}
                color={COLORS.primary}
              />
              <Text
                className="ml-1 text-[10px] font-extrabold tracking-[0.5px]"
                style={{ color: COLORS.primary }}
              >
                LỊCH TRÌNH ĐANG CHỈNH SỬA
              </Text>
            </View>
            <View className="rounded-full bg-white px-2 py-0.5">
              <Text className="text-[10px] font-bold" style={{ color: COLORS.primaryDark }}>
                {tripDuration}
              </Text>
            </View>
          </View>

          <Text className="mt-1 text-[18px] font-extrabold" style={{ color: COLORS.text }}>
            {tripTitle}
          </Text>

          {/* Vị trí chèn vào */}
          <Pressable
            onPress={() => setShowPicker((previous) => !previous)}
            className="mt-2.5 flex-row items-center rounded-2xl bg-white px-3 py-2.5"
          >
            <View
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: COLORS.mint }}
            >
              <MaterialCommunityIcons name="clock-outline" size={19} color={COLORS.primary} />
            </View>
            <View className="ml-2.5 min-w-0 flex-1">
              <Text className="text-[10px]" style={{ color: COLORS.muted }}>
                Vị trí chèn vào
              </Text>
              <Text
                numberOfLines={1}
                className="text-[13px] font-bold"
                style={{ color: COLORS.text }}
              >
                Ngày {position.day}: {currentSlot.label} {currentSlot.time}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={showPicker ? 'chevron-up' : 'tune-variant'}
              size={20}
              color={COLORS.primary}
            />
          </Pressable>

          {showPicker && (
            <View className="mt-2 rounded-2xl bg-white p-3">
              <Text className="text-[11px] font-bold" style={{ color: COLORS.muted }}>
                Chọn ngày
              </Text>
              <View className="mt-1.5 flex-row flex-wrap gap-2">
                {Array.from({ length: tripDays }, (_, index) => index + 1).map((day) => {
                  const selected = day === position.day;
                  return (
                    <Pressable
                      key={day}
                      onPress={() => setPosition((previous) => ({ ...previous, day }))}
                      className="rounded-full px-3.5 py-1.5"
                      style={{
                        backgroundColor: selected ? COLORS.primaryDark : COLORS.lightPurple,
                      }}
                    >
                      <Text
                        className="text-[12px] font-bold"
                        style={{ color: selected ? 'white' : COLORS.text }}
                      >
                        Ngày {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text className="mt-3 text-[11px] font-bold" style={{ color: COLORS.muted }}>
                Chọn khung giờ
              </Text>
              <View className="mt-1.5 flex-row gap-2">
                {timeSlots.map((slot) => {
                  const selected = slot.id === position.slot;
                  return (
                    <Pressable
                      key={slot.id}
                      onPress={() => {
                        setPosition((previous) => ({ ...previous, slot: slot.id }));
                        setShowPicker(false);
                      }}
                      className="flex-1 items-center rounded-xl py-2"
                      style={{
                        backgroundColor: selected ? COLORS.primaryDark : COLORS.lightPurple,
                      }}
                    >
                      <Text
                        className="text-[12px] font-bold"
                        style={{ color: selected ? 'white' : COLORS.text }}
                      >
                        {slot.label}
                      </Text>
                      <Text
                        className="text-[10px]"
                        style={{ color: selected ? '#D7FBF3' : COLORS.muted }}
                      >
                        {slot.time.split(' ')[0]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* ================= SEARCH ================= */}

        <View className="mt-4 flex-row items-center">
          <View className="h-11 flex-1 flex-row items-center rounded-full bg-white px-3.5">
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm tên địa điểm, quán ăn, danh lam..."
              placeholderTextColor="#9AA6AD"
              returnKeyType="search"
              className="ml-2 flex-1 text-[13px]"
              style={{ color: COLORS.text }}
            />
            {!!query && (
              <Pressable onPress={() => setQuery('')} hitSlop={6}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#B4BEC4" />
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => showComingSoon('Bộ lọc nâng cao')}
            className="ml-2 h-11 w-11 items-center justify-center rounded-full bg-white"
          >
            <MaterialCommunityIcons name="filter-variant" size={21} color={COLORS.text} />
          </Pressable>
        </View>

        {/* ================= CATEGORIES ================= */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        >
          {nearbyCategories.map((item) => {
            const selected = item.id === category;
            return (
              <Pressable
                key={item.id}
                onPress={() => setCategory(item.id)}
                className="flex-row items-center rounded-full px-3.5 py-2"
                style={{ backgroundColor: selected ? COLORS.primaryDark : COLORS.white }}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={15}
                  color={selected ? 'white' : COLORS.text}
                />
                <Text
                  className="ml-1.5 text-[12px] font-bold"
                  style={{ color: selected ? 'white' : COLORS.text }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ================= SUGGESTIONS ================= */}

        <View className="mb-3 mt-4 flex-row items-end justify-between">
          <View className="min-w-0 flex-1">
            <Text className="text-[16px] font-extrabold" style={{ color: COLORS.text }}>
              Gợi ý địa điểm lân cận
            </Text>
            <Text className="text-[11px]" style={{ color: COLORS.muted }}>
              Tối ưu thời gian di chuyển từ điểm trước
            </Text>
          </View>
          <Text className="text-[12px] font-bold" style={{ color: COLORS.primary }}>
            {visiblePlaces.length} địa điểm
          </Text>
        </View>

        {visiblePlaces.map((place) => (
          <NearbyPlaceCard
            key={place.id}
            place={place}
            day={position.day}
            added={addedIds.includes(place.id)}
            onToggle={() => togglePlace(place.id)}
          />
        ))}

        {visiblePlaces.length === 0 && (
          <View className="mb-4 items-center rounded-[22px] bg-white px-6 py-10">
            <MaterialCommunityIcons name="map-search-outline" size={36} color={COLORS.primary} />
            <Text className="mt-2 text-center text-[13px] font-bold" style={{ color: COLORS.text }}>
              Không tìm thấy địa điểm phù hợp
            </Text>
          </View>
        )}

        {/* ================= INFO ================= */}

        <View
          className="flex-row items-start rounded-2xl px-3.5 py-3"
          style={{ backgroundColor: COLORS.lightPurple }}
        >
          <MaterialCommunityIcons name="information-outline" size={17} color={COLORS.primary} />
          <Text className="ml-2 flex-1 text-[11px]" style={{ color: '#445577' }}>
            Địa điểm đã chọn sẽ tự động xếp vào khung giờ phù hợp trên lịch
            trình <Text className="font-bold">Ngày {position.day}</Text>.
          </Text>
        </View>
      </ScrollView>

      {/* ================= DONE BAR ================= */}

      {addedIds.length > 0 && (
        <View
          className="absolute bottom-0 left-0 right-0 flex-row items-center bg-white px-4 pb-6 pt-3"
          style={{ elevation: 12, shadowOpacity: 0.08, shadowRadius: 10 }}
        >
          <View className="min-w-0 flex-1">
            <Text className="text-[13px] font-extrabold" style={{ color: COLORS.text }}>
              Đã chọn {addedIds.length} địa điểm
            </Text>
            <Text className="text-[11px]" style={{ color: COLORS.muted }}>
              Ngày {position.day} • {currentSlot.label}
            </Text>
          </View>

          <Pressable
            onPress={handleDone}
            className="h-11 flex-row items-center rounded-full px-5 active:opacity-80"
            style={{ backgroundColor: COLORS.primaryDark }}
          >
            <Text className="text-[13px] font-bold text-white">Lưu vào lịch trình</Text>
            <MaterialCommunityIcons
              name="check"
              size={17}
              color="white"
              style={{ marginLeft: 6 }}
            />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
