import React, { useMemo, useState } from 'react';
import {
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomTabBar, {
  type AppTab,
} from '../../components/BottomTabBar';

import { trips as mockTrips, type Trip } from '../../constants/trips';

// ==================== TYPES ====================

type TripFilter = 'upcoming' | 'saved' | 'completed';

type MyTripsScreenProps = {
  onTabPress?: (tab: AppTab) => void;
  onTripPress?: (tripId: string) => void;
  onEditTripPress?: (tripId: string) => void;
  onCreateTripPress?: () => void;
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
  white: '#FFFFFF',
};

const filters: { id: TripFilter; label: string }[] = [
  { id: 'upcoming', label: 'Sắp tới' },
  { id: 'saved', label: 'Đã lưu' },
  { id: 'completed', label: 'Đã đi' },
];

// Trip nào thuộc tab nào
const matchFilter = (trip: Trip, filter: TripFilter) => {
  if (filter === 'upcoming') {
    return (
      trip.status === 'upcoming' ||
      trip.status === 'planned' ||
      trip.status === 'draft'
    );
  }
  return trip.status === filter;
};

// ==================== TRIP IMAGE ====================

function TripImage({
  trip,
  height,
  onMorePress,
}: {
  trip: Trip;
  height: number;
  onMorePress: () => void;
}) {
  const chip = {
    upcoming: { icon: 'circle' as const, bg: '#D7FBF3', color: '#06695F' },
    planned: { icon: 'calendar-blank-outline' as const, bg: '#FFFFFF', color: COLORS.text },
    draft: { icon: 'pencil-outline' as const, bg: '#FFE8C7', color: '#8A4B00' },
    saved: { icon: 'bookmark-outline' as const, bg: '#FFFFFF', color: COLORS.primary },
    completed: { icon: 'check-circle-outline' as const, bg: '#E3F6E5', color: '#23793A' },
  }[trip.status];

  return (
    <ImageBackground
      source={{ uri: trip.image }}
      style={{ height }}
      imageStyle={{ borderRadius: 18 }}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.65)']}
        style={{
          flex: 1,
          borderRadius: 18,
          padding: 12,
          justifyContent: 'space-between',
        }}
      >
        <View className="flex-row items-start justify-between">
          <View
            className="flex-row items-center rounded-full px-2.5 py-1"
            style={{ backgroundColor: chip.bg }}
          >
            <MaterialCommunityIcons
              name={chip.icon}
              size={trip.status === 'upcoming' ? 8 : 12}
              color={chip.color}
            />
            <Text
              className="ml-1 text-[10px] font-bold"
              style={{ color: chip.color }}
            >
              {trip.statusLabel}
            </Text>
          </View>

          <Pressable
            onPress={onMorePress}
            hitSlop={8}
            className="h-7 w-7 items-center justify-center rounded-full bg-black/40"
          >
            <MaterialCommunityIcons
              name="dots-vertical"
              size={18}
              color="white"
            />
          </Pressable>
        </View>

        <View>
          <Text
            numberOfLines={2}
            className="text-[17px] font-extrabold text-white"
          >
            {trip.title}
          </Text>
          <View className="mt-1 flex-row items-center">
            <MaterialCommunityIcons
              name="map-marker"
              size={13}
              color="white"
            />
            <Text className="ml-1 text-[11px] font-semibold text-white">
              {trip.location} • {trip.duration}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

// ==================== SMALL PIECES ====================

function EditButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="ml-2.5 h-11 w-11 items-center justify-center rounded-full active:opacity-70"
      style={{ backgroundColor: COLORS.lightPurple }}
      accessibilityLabel="Chỉnh sửa chuyến đi"
    >
      <MaterialCommunityIcons
        name="pencil-outline"
        size={19}
        color={COLORS.primaryDark}
      />
    </Pressable>
  );
}

function IconText({
  icon,
  text,
  bold,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  text: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row items-center">
      <MaterialCommunityIcons name={icon} size={15} color={COLORS.muted} />
      <Text
        className={`ml-1.5 text-[12px] ${bold ? 'font-extrabold' : 'font-medium'}`}
        style={{ color: COLORS.text }}
      >
        {text}
      </Text>
    </View>
  );
}

// ==================== TRIP CARD ====================

function TripCard({
  trip,
  onPress,
  onEdit,
  onMore,
}: {
  trip: Trip;
  onPress: () => void;
  onEdit: () => void;
  onMore: () => void;
}) {
  // ---------- Chuyến sắp khởi hành: thẻ đầy đủ ----------
  if (trip.status === 'upcoming') {
    return (
      <View className="mb-4 rounded-[22px] bg-white p-2.5">
        <TripImage trip={trip} height={170} onMorePress={onMore} />

        <View className="px-1.5 pt-3">
          <View
            className="flex-row rounded-2xl px-3 py-2.5"
            style={{ backgroundColor: '#F3F4FF' }}
          >
            {[
              { icon: 'calendar-range' as const, label: 'Thời gian', value: trip.dateRange },
              { icon: 'account-group-outline' as const, label: 'Khách đi', value: trip.guests },
            ].map((item) => (
              <View key={item.label} className="flex-1 flex-row items-center">
                <View
                  className="h-8 w-8 items-center justify-center rounded-xl"
                  style={{ backgroundColor: COLORS.mint }}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={17}
                    color={COLORS.primary}
                  />
                </View>
                <View className="ml-2">
                  <Text className="text-[10px]" style={{ color: COLORS.muted }}>
                    {item.label}
                  </Text>
                  <Text
                    className="text-[12px] font-bold"
                    style={{ color: COLORS.text }}
                  >
                    {item.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className="mt-3">
            <IconText icon="cash-multiple" text={`Dự toán: ${trip.budget}`} bold />
          </View>

          <View className="mt-2 flex-row justify-between">
            <IconText icon="map-marker-path" text={`${trip.placeCount} địa điểm trong lịch`} />
            {!!trip.hotelBooked && (
              <IconText icon="bed-outline" text={`Đã đặt ${trip.hotelBooked} khách sạn`} />
            )}
          </View>

          <View className="mb-1 mt-3.5 flex-row items-center">
            <Pressable
              onPress={onPress}
              className="h-11 flex-1 flex-row items-center justify-center rounded-full active:opacity-80"
              style={{ backgroundColor: COLORS.primaryDark }}
            >
              <Text className="text-[13px] font-bold text-white">
                Xem chi tiết lịch trình
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={17}
                color="white"
                style={{ marginLeft: 6 }}
              />
            </Pressable>
            <EditButton onPress={onEdit} />
          </View>
        </View>
      </View>
    );
  }

  // ---------- Bản nháp ----------
  if (trip.status === 'draft') {
    return (
      <View className="mb-4 rounded-[22px] bg-white p-2.5">
        <TripImage trip={trip} height={135} onMorePress={onMore} />

        <View className="px-1.5 pt-3">
          <View className="flex-row items-center justify-between">
            <IconText icon="calendar-blank-outline" text={`${trip.dateRange} • ${trip.guests}`} />
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: COLORS.lightPurple }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{ color: '#445577' }}
              >
                {trip.placeCount} địa điểm đã chọn
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onEdit}
            className="mb-1 mt-3 h-11 flex-row items-center justify-center rounded-full active:opacity-70"
            style={{ backgroundColor: COLORS.lightPurple }}
          >
            <MaterialCommunityIcons
              name="file-document-edit-outline"
              size={17}
              color={COLORS.primaryDark}
            />
            <Text
              className="ml-1.5 text-[13px] font-bold"
              style={{ color: COLORS.primaryDark }}
            >
              Tiếp tục chỉnh sửa
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ---------- Đã lên lịch / Đã lưu / Đã đi: thẻ gọn ----------
  const isCompleted = trip.status === 'completed';

  return (
    <View className="mb-4 rounded-[22px] bg-white p-2.5">
      <TripImage trip={trip} height={145} onMorePress={onMore} />

      <View className="px-1.5 pt-3">
        <View className="flex-row items-center justify-between">
          <IconText
            icon={isCompleted ? 'calendar-check-outline' : 'account-group-outline'}
            text={isCompleted ? trip.dateRange ?? '' : trip.guests}
          />
          {!!trip.budget && (
            <IconText icon="cash-multiple" text={trip.budget} bold />
          )}
        </View>

        <View className="mb-1 mt-3 flex-row items-center">
          <Pressable
            onPress={onPress}
            className="h-11 flex-1 flex-row items-center justify-center rounded-full active:opacity-70"
            style={{ backgroundColor: '#9EF0E2' }}
          >
            <Text
              className="text-[13px] font-bold"
              style={{ color: COLORS.primaryDark }}
            >
              {isCompleted ? 'Xem lại hành trình' : 'Xem chi tiết'}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={COLORS.primaryDark}
            />
          </Pressable>
          {!isCompleted && <EditButton onPress={onEdit} />}
        </View>
      </View>
    </View>
  );
}

// ==================== MAIN SCREEN ====================

export default function MyTripsScreen({
  onTabPress,
  onTripPress,
  onEditTripPress,
  onCreateTripPress,
}: MyTripsScreenProps) {
  const [filter, setFilter] = useState<TripFilter>('upcoming');
  const [trips, setTrips] = useState<Trip[]>(mockTrips);

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

  const counts = useMemo(
    () => ({
      // Bản nháp không tính vào số chuyến sắp tới
      upcoming: trips.filter(
        (trip) => trip.status === 'upcoming' || trip.status === 'planned'
      ).length,
      saved: trips.filter((trip) => trip.status === 'saved').length,
      completed: trips.filter((trip) => trip.status === 'completed').length,
    }),
    [trips]
  );

  const visibleTrips = trips.filter((trip) => matchFilter(trip, filter));

  const handleTripPress = (trip: Trip) => {
    if (onTripPress) onTripPress(trip.id);
    else showComingSoon('Chi tiết chuyến đi');
  };

  const handleEditTrip = (trip: Trip) => {
    if (onEditTripPress) onEditTripPress(trip.id);
    else showComingSoon('Chỉnh sửa chuyến đi');
  };

  const handleCreateTrip = () => {
    if (onCreateTripPress) onCreateTripPress();
    else showComingSoon('Lên lịch mới');
  };

  const handleMore = (trip: Trip) => {
    Alert.alert(trip.title, undefined, [
      { text: 'Chia sẻ', onPress: () => showComingSoon('Chia sẻ chuyến đi') },
      {
        text: 'Xoá chuyến đi',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Xoá chuyến đi', `Bạn chắc chắn muốn xoá "${trip.title}"?`, [
            { text: 'Hủy', style: 'cancel' },
            {
              text: 'Xoá',
              style: 'destructive',
              onPress: () =>
                setTrips((previous) => previous.filter((item) => item.id !== trip.id)),
            },
          ]),
      },
      { text: 'Đóng', style: 'cancel' },
    ]);
  };

  const emptyText = {
    upcoming: 'Bạn chưa có chuyến đi nào sắp tới.',
    saved: 'Bạn chưa lưu lịch trình nào.',
    completed: 'Bạn chưa hoàn thành chuyến đi nào.',
  }[filter];

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{ backgroundColor: COLORS.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* ================= HEADER ================= */}

      <View className="h-[60px] flex-row items-center justify-between bg-white px-4">
        <View className="flex-row items-center">
          <View
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: COLORS.mint }}
          >
            <MaterialCommunityIcons
              name="compass-outline"
              size={21}
              color={COLORS.primary}
            />
          </View>
          <Text
            className="ml-2.5 text-[17px] font-extrabold"
            style={{ color: COLORS.text }}
          >
            Chuyến Đi
          </Text>
        </View>

        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => showComingSoon('Thông báo')}>
            <MaterialCommunityIcons name="bell-outline" size={23} color="#8C989E" />
          </Pressable>
          <Pressable
            onPress={() => handleTabPress('profile')}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: COLORS.primaryDark }}
          >
            <MaterialCommunityIcons name="account" size={22} color="white" />
          </Pressable>
        </View>
      </View>

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
          <View className="min-w-0 flex-1">
            <Text
              className="text-[22px] font-extrabold"
              style={{ color: COLORS.text }}
            >
              Chuyến đi của tôi
            </Text>
            <Text className="mt-0.5 text-[12px]" style={{ color: COLORS.muted }}>
              Sẵn sàng cho những hành trình đáng nhớ
            </Text>
          </View>

          <Pressable
            onPress={handleCreateTrip}
            className="h-12 w-12 items-center justify-center rounded-full active:opacity-80"
            style={{ backgroundColor: COLORS.primaryDark }}
            accessibilityLabel="Tạo chuyến đi mới"
          >
            <MaterialCommunityIcons name="plus" size={26} color="white" />
          </Pressable>
        </View>

        {/* ================= FILTER TABS ================= */}

        <View className="mt-4 flex-row rounded-full p-1" style={{ backgroundColor: COLORS.lightPurple }}>
          {filters.map((item) => {
            const selected = item.id === filter;

            return (
              <Pressable
                key={item.id}
                onPress={() => setFilter(item.id)}
                className="flex-1 flex-row items-center justify-center rounded-full py-2"
                style={{ backgroundColor: selected ? COLORS.white : 'transparent' }}
              >
                <Text
                  className="text-[13px] font-bold"
                  style={{ color: selected ? COLORS.primaryDark : COLORS.muted }}
                >
                  {item.label}
                </Text>
                <View
                  className="ml-1.5 min-w-[20px] items-center rounded-full px-1.5"
                  style={{ backgroundColor: selected ? COLORS.mint : '#DCDFF5' }}
                >
                  <Text
                    className="text-[11px] font-bold"
                    style={{ color: selected ? COLORS.primaryDark : COLORS.muted }}
                  >
                    {counts[item.id]}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ================= TRIP LIST ================= */}

        <View className="mt-4">
          {visibleTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onPress={() => handleTripPress(trip)}
              onEdit={() => handleEditTrip(trip)}
              onMore={() => handleMore(trip)}
            />
          ))}

          {visibleTrips.length === 0 && (
            <View className="mb-4 items-center rounded-[22px] bg-white px-6 py-10">
              <View
                className="h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: COLORS.mint }}
              >
                <MaterialCommunityIcons
                  name="bag-suitcase-outline"
                  size={30}
                  color={COLORS.primary}
                />
              </View>
              <Text
                className="mt-3 text-center text-[14px] font-bold"
                style={{ color: COLORS.text }}
              >
                {emptyText}
              </Text>
            </View>
          )}
        </View>

        {/* ================= NEW TRIP CTA ================= */}

        <LinearGradient
          colors={['#E2FCF8', '#EEF0FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 22,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View className="min-w-0 flex-1 pr-3">
            <Text
              className="text-[15px] font-extrabold"
              style={{ color: COLORS.text }}
            >
              Bạn có dự định mới?
            </Text>
            <Text className="mt-0.5 text-[11px]" style={{ color: '#5D7782' }}>
              Khám phá thêm điểm đến mới hoặc lên kế hoạch chuyến đi tiếp
              theo của bạn.
            </Text>
          </View>

          <Pressable
            onPress={handleCreateTrip}
            className="flex-row items-center rounded-full px-4 py-2.5 active:opacity-80"
            style={{ backgroundColor: COLORS.primaryDark }}
          >
            <Text className="text-[12px] font-bold text-white">Lên lịch mới</Text>
            <MaterialCommunityIcons
              name="plus"
              size={16}
              color="white"
              style={{ marginLeft: 4 }}
            />
          </Pressable>
        </LinearGradient>
      </ScrollView>

      {/* ================= BOTTOM NAVIGATION ================= */}

      <BottomTabBar activeTab="trips" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}
