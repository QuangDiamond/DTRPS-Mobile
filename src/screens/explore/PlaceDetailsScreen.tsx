import React, { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  ImageBackground,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  Text,
  View,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getPlaceById,
  type PlaceInfoItem,
  type PhotoSpot,
} from '../../constants/places';

// ==================== TYPES ====================

type PlaceDetailsScreenProps = {
  placeId: string;
  favorite?: boolean;
  onBack?: () => void;
  onToggleFavorite?: () => void;
  onProfilePress?: () => void;
};

// ==================== COLORS ====================

const COLORS = {
  primary: '#087A78',
  primaryDark: '#075C66',
  button: '#006C64',
  text: '#13364A',
  muted: '#72818C',
  background: '#F8F8FF',
  mint: '#C3F8F0',
  lightPurple: '#EBEDFF',
  star: '#E0A100',
  white: '#FFFFFF',
};

const INFO_TONES: Record<
  PlaceInfoItem['tone'],
  { background: string; icon: string }
> = {
  blue: { background: '#E3EDFF', icon: '#3B6FD8' },
  orange: { background: '#FFEBD6', icon: '#D7791A' },
  green: { background: '#D8F7EC', icon: '#13936B' },
  purple: { background: '#ECE6FF', icon: '#6F52D9' },
};

// Avatar khách đã ghé thăm (mock)
const VISITORS = [
  { initials: 'VN', color: '#9EF1E7', text: '#006D68' },
  { initials: 'AL', color: '#FFE0B8', text: '#A35A00' },
  { initials: 'TC', color: '#DCD3FF', text: '#5940B8' },
];

// ==================== SECTION TITLE ====================

function SectionHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View className="mb-3 mt-6 flex-row items-center justify-between">
      <Text
        className="text-[17px] font-extrabold"
        style={{ color: COLORS.text }}
      >
        {title}
      </Text>
      {right}
    </View>
  );
}

// ==================== INFO CARD ====================

function InfoCard({ item }: { item: PlaceInfoItem }) {
  const tone = INFO_TONES[item.tone];

  return (
    <View
      className="mb-3 rounded-2xl bg-white p-3.5"
      style={{ width: '48.5%' }}
    >
      <View
        className="h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: tone.background }}
      >
        <MaterialCommunityIcons
          name={item.icon}
          size={19}
          color={tone.icon}
        />
      </View>

      <Text
        className="mt-2.5 text-[11px]"
        style={{ color: COLORS.muted }}
      >
        {item.label}
      </Text>

      <Text
        numberOfLines={1}
        className="mt-0.5 text-[16px] font-extrabold"
        style={{ color: COLORS.text }}
      >
        {item.value}
      </Text>

      <Text
        numberOfLines={1}
        className="mt-0.5 text-[10px]"
        style={{ color: '#8793AB' }}
      >
        {item.note}
      </Text>
    </View>
  );
}

// ==================== PHOTO SPOT CARD ====================

function PhotoSpotCard({
  spot,
  onPress,
}: {
  spot: PhotoSpot;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mr-3 overflow-hidden rounded-2xl bg-white active:opacity-90"
      style={{ width: 168 }}
    >
      <ImageBackground
        source={{ uri: spot.image }}
        resizeMode="cover"
        style={{ height: 110, backgroundColor: '#CFE9E6' }}
      />

      <View className="px-3 py-2.5">
        <Text
          numberOfLines={1}
          className="text-[14px] font-extrabold"
          style={{ color: COLORS.text }}
        >
          {spot.name}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-0.5 text-[11px]"
          style={{ color: COLORS.muted }}
        >
          {spot.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

// ==================== MAP PREVIEW ====================

// Bản đồ giả lập (chưa tích hợp map thật)
function MapPreview({
  landmark,
  onOpenMap,
}: {
  landmark: string;
  onOpenMap: () => void;
}) {
  return (
    <View className="h-[150px] overflow-hidden rounded-[20px]">
      <LinearGradient
        colors={['#BDE9F2', '#A6DCE9', '#C7EEDF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Đường lưới giả lập đường phố */}
        {[28, 64, 102].map((top) => (
          <View
            key={`h-${top}`}
            className="absolute left-0 right-0 h-[2px] bg-white/60"
            style={{ top }}
          />
        ))}
        {[60, 150, 250].map((left) => (
          <View
            key={`v-${left}`}
            className="absolute bottom-0 top-0 w-[2px] bg-white/60"
            style={{ left }}
          />
        ))}

        {/* Mảng đất liền */}
        <View
          className="absolute rounded-full bg-[#DDF3D6]"
          style={{ width: 140, height: 90, top: -20, right: -30 }}
        />
        <View
          className="absolute rounded-full bg-[#DDF3D6]"
          style={{ width: 90, height: 60, bottom: 30, left: 110 }}
        />

        {/* Ghim vị trí */}
        <View
          className="absolute items-center"
          style={{ top: 34, left: '50%', marginLeft: -16 }}
        >
          <View
            className="h-8 w-8 items-center justify-center rounded-full border-[3px] border-white"
            style={{ backgroundColor: COLORS.primary }}
          >
            <MaterialCommunityIcons
              name="map-marker"
              size={16}
              color={COLORS.white}
            />
          </View>
          <View className="mt-1 h-2 w-5 rounded-full bg-black/15" />
        </View>

        {/* Nhãn & nút */}
        <View className="absolute bottom-3 left-3 right-3 flex-row items-center justify-between">
          <View className="mr-2 flex-1 flex-row items-center rounded-full bg-[#13364A]/80 px-3 py-1.5">
            <MaterialCommunityIcons
              name="navigation-variant-outline"
              size={14}
              color={COLORS.white}
            />
            <Text
              numberOfLines={1}
              className="ml-1.5 flex-1 text-[11px] font-bold text-white"
            >
              {landmark}
            </Text>
          </View>

          <Pressable
            onPress={onOpenMap}
            className="flex-row items-center rounded-full bg-white px-3 py-1.5 active:opacity-80"
          >
            <Text
              className="text-[11px] font-bold"
              style={{ color: COLORS.text }}
            >
              Mở Bản Đồ
            </Text>
            <MaterialCommunityIcons
              name="open-in-new"
              size={13}
              color={COLORS.text}
              style={{ marginLeft: 4 }}
            />
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

// ==================== MAIN SCREEN ====================

export default function PlaceDetailsScreen({
  placeId,
  favorite = false,
  onBack,
  onToggleFavorite,
  onProfilePress,
}: PlaceDetailsScreenProps) {
  const place = getPlaceById(placeId);

  const [introExpanded, setIntroExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  // Nút Back của Android quay về màn Khám phá
  useEffect(() => {
    if (!onBack) return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onBack();
        return true;
      }
    );

    return () => subscription.remove();
  }, [onBack]);

  const showComingSoon = (title: string) => {
    Alert.alert(title, 'Chức năng đang được phát triển.');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      showComingSoon('Quay lại');
    }
  };

  if (!place) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: COLORS.background }}
      >
        <MaterialCommunityIcons
          name="map-marker-off-outline"
          size={48}
          color={COLORS.muted}
        />
        <Text
          className="mt-3 text-[16px] font-bold"
          style={{ color: COLORS.text }}
        >
          Không tìm thấy địa điểm
        </Text>
        <Pressable
          onPress={handleBack}
          className="mt-5 rounded-full bg-[#E9EBFF] px-6 py-3"
        >
          <Text className="font-semibold text-[#334E68]">
            Quay lại
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleShare = () => {
    Share.share({
      message: `${place.name} - ${place.address}\nKhám phá cùng SmartTravel Vietnam AI ✨`,
    }).catch(() => undefined);
  };

  const handleAddToTrip = () => {
    Alert.alert(
      'Thêm vào Chuyến đi',
      `Đã thêm "${place.name}" vào chuyến đi của bạn (demo).`
    );
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

      <View className="h-[58px] flex-row items-center justify-between bg-white px-4">
        <View className="flex-1 flex-row items-center">
          <Pressable
            onPress={handleBack}
            accessibilityLabel="Quay lại"
            className="mr-2 h-10 w-9 items-center justify-center"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#435369"
            />
          </Pressable>

          <Text
            className="text-[18px] font-bold"
            style={{ color: '#27374B' }}
          >
            Chi Tiết Điểm Đến
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={handleShare}
            accessibilityLabel="Chia sẻ"
            className="h-9 w-9 items-center justify-center"
          >
            <MaterialCommunityIcons
              name="share-variant-outline"
              size={22}
              color="#5C6B75"
            />
          </Pressable>

          <Pressable
            onPress={onProfilePress}
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
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ================= HERO IMAGE ================= */}

        <ImageBackground
          source={{ uri: place.image }}
          resizeMode="cover"
          style={{ height: 240, backgroundColor: '#CFE9E6' }}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0)', 'rgba(248,248,255,0.95)']}
            locations={[0, 0.5, 1]}
            style={{
              flex: 1,
              padding: 14,
              justifyContent: 'space-between',
            }}
          >
            <View className="flex-row items-start justify-between">
              {place.badge ? (
                <View className="flex-row items-center rounded-full bg-white/95 px-3 py-1.5">
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={14}
                    color="#C68B16"
                  />
                  <Text
                    className="ml-1 text-[11px] font-bold"
                    style={{ color: COLORS.text }}
                  >
                    {place.badge}
                  </Text>
                </View>
              ) : (
                <View />
              )}

              <Pressable
                onPress={onToggleFavorite}
                hitSlop={8}
                accessibilityLabel={
                  favorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'
                }
                className="h-10 w-10 items-center justify-center rounded-full bg-white"
              >
                <MaterialCommunityIcons
                  name={favorite ? 'heart' : 'heart-outline'}
                  size={22}
                  color={favorite ? '#D93B4A' : '#5C6B75'}
                />
              </Pressable>
            </View>

            {/* Rating & visitors */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center rounded-full bg-white px-2.5 py-1">
                <MaterialCommunityIcons
                  name="star"
                  size={15}
                  color={COLORS.star}
                />
                <Text
                  className="ml-1 text-[13px] font-extrabold"
                  style={{ color: COLORS.text }}
                >
                  {place.rating}
                </Text>
                <Text
                  className="ml-1 text-[11px]"
                  style={{ color: COLORS.muted }}
                >
                  ({place.reviewCount})
                </Text>
              </View>

              <View className="flex-row items-center">
                {VISITORS.map((visitor, index) => (
                  <View
                    key={visitor.initials}
                    className="h-7 w-7 items-center justify-center rounded-full border-2 border-white"
                    style={{
                      backgroundColor: visitor.color,
                      marginLeft: index === 0 ? 0 : -8,
                    }}
                  >
                    <Text
                      className="text-[9px] font-extrabold"
                      style={{ color: visitor.text }}
                    >
                      {visitor.initials}
                    </Text>
                  </View>
                ))}
                <View
                  className="h-7 items-center justify-center rounded-full border-2 border-white bg-[#EBEDFF] px-1.5"
                  style={{ marginLeft: -8 }}
                >
                  <Text className="text-[9px] font-extrabold text-[#405A82]">
                    +12k
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        <View className="px-4">
          {/* ================= TITLE ================= */}

          <View className="mt-3 flex-row items-start justify-between">
            <Text
              className="mr-2 flex-1 text-[28px] font-extrabold leading-[34px]"
              style={{ color: COLORS.text }}
            >
              {place.name}
            </Text>

            <View className="mt-1.5 rounded-full bg-[#C3F8F0] px-2.5 py-1">
              <Text className="text-[10px] font-extrabold text-[#006D68]">
                {place.rank}
              </Text>
            </View>
          </View>

          <View className="mt-1 flex-row items-center">
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={15}
              color={COLORS.primary}
            />
            <Text
              className="ml-1 flex-1 text-[12px]"
              style={{ color: COLORS.muted }}
            >
              {place.address}
            </Text>
          </View>

          {/* Tags */}
          <View className="mt-3 flex-row flex-wrap gap-2">
            {place.tags.map((tag) => (
              <View
                key={tag.label}
                className="flex-row items-center rounded-full px-3 py-1.5"
                style={{ backgroundColor: COLORS.lightPurple }}
              >
                <MaterialCommunityIcons
                  name={tag.icon}
                  size={14}
                  color="#4A7091"
                />
                <Text className="ml-1.5 text-[11px] font-semibold text-[#36546A]">
                  {tag.label}
                </Text>
              </View>
            ))}
          </View>

          {/* ================= AI WEATHER ================= */}

          <LinearGradient
            colors={['#D6FAF6', '#E7E9FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 20,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name="auto-fix"
                  size={17}
                  color={COLORS.primary}
                />
                <Text
                  className="ml-1.5 text-[13px] font-extrabold"
                  style={{ color: COLORS.primaryDark }}
                >
                  AI Thời Điểm Khám Phá
                </Text>
              </View>

              <View className="rounded-full bg-white px-2.5 py-1">
                <Text className="text-[10px] font-bold text-[#00766F]">
                  {place.weather.status}
                </Text>
              </View>
            </View>

            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center">
                <MaterialCommunityIcons
                  name={place.weather.icon}
                  size={34}
                  color="#E0A100"
                />
                <View className="ml-2.5 flex-1">
                  <Text
                    className="text-[22px] font-extrabold"
                    style={{ color: COLORS.text }}
                  >
                    {place.weather.temperature}°C
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="text-[11px]"
                    style={{ color: '#526C83' }}
                  >
                    {place.weather.condition}
                  </Text>
                </View>
              </View>

              <View className="items-end">
                <Text className="text-[11px]" style={{ color: '#526C83' }}>
                  {place.weather.extraLabel}
                </Text>
                <Text
                  className="text-[15px] font-extrabold"
                  style={{ color: COLORS.text }}
                >
                  {place.weather.extraValue}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* ================= INTRO ================= */}

          <SectionHeader title="Giới thiệu điểm đến" />

          <Text
            numberOfLines={introExpanded ? undefined : 3}
            className="text-[13px] leading-[20px]"
            style={{ color: '#4F5F6B' }}
          >
            {place.intro}
          </Text>

          <Pressable
            onPress={() => setIntroExpanded((value) => !value)}
            className="mt-1.5 flex-row items-center self-start"
            hitSlop={6}
          >
            <Text
              className="text-[12px] font-bold"
              style={{ color: COLORS.primary }}
            >
              {introExpanded ? 'Thu gọn' : 'Xem thêm'}
            </Text>
            <MaterialCommunityIcons
              name={introExpanded ? 'chevron-up' : 'chevron-down'}
              size={17}
              color={COLORS.primary}
            />
          </Pressable>

          {/* ================= PRACTICAL INFO ================= */}

          <SectionHeader title="Thông tin thực tế" />

          <View className="flex-row flex-wrap justify-between">
            {place.info.map((item) => (
              <InfoCard key={item.label} item={item} />
            ))}
          </View>

          {/* ================= PHOTO SPOTS ================= */}

          <SectionHeader
            title="Góc ảnh nổi tiếng"
            right={
              <Text
                className="text-[12px] font-bold"
                style={{ color: COLORS.primary }}
              >
                {place.photoSpots.length} địa điểm con
              </Text>
            }
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {place.photoSpots.map((spot) => (
            <PhotoSpotCard
              key={spot.name}
              spot={spot}
              onPress={() => showComingSoon(spot.name)}
            />
          ))}
        </ScrollView>

        {/* ================= MAP ================= */}

        <View className="px-4">
          <SectionHeader
            title="Vị trí & Đường đi"
            right={
              <Text
                className="text-[11px]"
                style={{ color: COLORS.muted }}
              >
                {place.map.distance}
              </Text>
            }
          />

          <MapPreview
            landmark={place.map.landmark}
            onOpenMap={() => showComingSoon('Bản đồ')}
          />
        </View>
      </ScrollView>

      {/* ================= BOTTOM ACTION BAR ================= */}

      <View className="flex-row items-center border-t border-[#E6E9EE] bg-white px-4 py-3">
        <Pressable
          onPress={() => showComingSoon('Chỉ đường')}
          accessibilityLabel="Chỉ đường"
          className="h-12 w-12 items-center justify-center rounded-full bg-[#EBEDFF] active:opacity-80"
        >
          <MaterialCommunityIcons
            name="directions"
            size={22}
            color="#405A82"
          />
        </Pressable>

        <Pressable
          onPress={() => setSaved((value) => !value)}
          accessibilityLabel="Lưu địa điểm"
          className="ml-2.5 h-12 w-12 items-center justify-center rounded-full active:opacity-80"
          style={{
            backgroundColor: saved ? COLORS.mint : '#EBEDFF',
          }}
        >
          <MaterialCommunityIcons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={saved ? COLORS.primary : '#405A82'}
          />
        </Pressable>

        <Pressable
          onPress={handleAddToTrip}
          className="ml-3 h-12 flex-1 flex-row items-center justify-center rounded-full active:opacity-80"
          style={{ backgroundColor: COLORS.button, elevation: 3 }}
        >
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={21}
            color={COLORS.white}
          />
          <Text className="ml-2 text-[15px] font-bold text-white">
            Thêm vào Chuyến đi
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
