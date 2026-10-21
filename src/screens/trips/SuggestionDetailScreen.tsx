import React, { useState } from 'react';
import {

  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import SelectedPlacesScreen from './SelectedPlacesScreen';

import {
  getMatchLabel,
  interestTagLabels,
  type SuggestedPlace,
} from '../../constants/suggestedPlaces';

// ==================== TYPES ====================

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type SuggestionDetailScreenProps = {
  place: SuggestedPlace;
  matchScore: number;
  /** Sở thích người dùng đã chọn, để tô nổi các tag trùng */
  interests: string[];
  favorite: boolean;
  inPlan: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
  onTogglePlan: () => void;
  onViewPlan?: () => void;
  planCount?: number;
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
  heart: '#E5484D',
  white: '#FFFFFF',
};

// ==================== MAIN SCREEN ====================

export default function SuggestionDetailScreen({
  place,
  matchScore,
  interests,
  favorite,
  inPlan,
  onBack,
  onToggleFavorite,
  onTogglePlan,

                                                 planCount,

}: SuggestionDetailScreenProps) {
  const { width } = useWindowDimensions();
  const [imageIndex, setImageIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  const [showSelectedPlaces, setShowSelectedPlaces] = useState(false);


  const gallery = [place.image, ...place.highlights.map((item) => item.image)];

  const infoRows: { icon: IconName; label: string; value: string }[] = [
    { icon: 'clock-outline', label: 'Giờ mở cửa', value: place.info.openHours },
    { icon: 'ticket-outline', label: 'Giá vé', value: place.info.price },
    { icon: 'timer-sand', label: 'Thời gian gợi ý', value: place.info.duration },
    { icon: 'weather-sunny', label: 'Thời điểm đẹp nhất', value: place.info.bestTime },
  ];


// ==================== SELECTED PLACES ====================

  if (showSelectedPlaces) {
    return (
      <SelectedPlacesScreen
        onBack={() => {
          setShowSelectedPlaces(false);
        }}
      />
    );
  }


  return (
    <SafeAreaView edges={['bottom']} className="flex-1" style={{ backgroundColor: COLORS.white }}>
      <StatusBar barStyle="light-content" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces={false}>
        {/* ================= GALLERY ================= */}

        <View style={{ height: 300 }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) =>
              setImageIndex(Math.round(event.nativeEvent.contentOffset.x / width))
            }
          >
            {gallery.map((uri, index) => (
              <ImageBackground key={`${uri}-${index}`} source={{ uri }} style={{ width, height: 300 }} />
            ))}
          </ScrollView>

          {/* Header nổi trên ảnh */}
          <SafeAreaView edges={['top']} className="absolute left-0 right-0 top-0">
            <View className="flex-row items-center justify-between px-4 pt-2">
              <View className="flex-row items-center">
                <Pressable
                  onPress={onBack}
                  className="h-9 w-9 items-center justify-center rounded-full bg-white/90"
                  accessibilityLabel="Quay lại"
                >
                  <MaterialCommunityIcons name="chevron-left" size={26} color={COLORS.text} />
                </Pressable>
                <Text
                  className="ml-2.5 text-[16px] font-bold text-white"
                  style={{ textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 6 }}
                >
                  Chi tiết gợi ý điểm đến
                </Text>
              </View>

              <Pressable
                onPress={onToggleFavorite}
                className="h-9 w-9 items-center justify-center rounded-full bg-white"
                accessibilityLabel={favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
              >
                <MaterialCommunityIcons
                  name={favorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={favorite ? COLORS.heart : COLORS.text}
                />
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Chấm chỉ số ảnh */}
          <View className="absolute bottom-7 left-0 right-0 flex-row justify-center gap-1.5">
            {gallery.map((uri, index) => (
              <View
                key={`dot-${uri}-${index}`}
                className="h-1.5 rounded-full"
                style={{
                  width: index === imageIndex ? 16 : 6,
                  backgroundColor: index === imageIndex ? COLORS.white : 'rgba(255,255,255,0.6)',
                }}
              />
            ))}
          </View>
        </View>

        {/* ================= CONTENT ================= */}

        <View className="-mt-5 rounded-t-[26px] bg-white px-4 pb-6 pt-4">
          {/* Độ phù hợp */}
          <View className="flex-row gap-2.5">
            <View className="flex-1 rounded-2xl p-3" style={{ backgroundColor: COLORS.background }}>
              <Text className="text-[11px] font-semibold" style={{ color: COLORS.text }}>
                Độ phù hợp với bạn
              </Text>
              <Text className="mt-0.5 text-[20px] font-extrabold" style={{ color: COLORS.primaryDark }}>
                {matchScore}%
              </Text>
              <View className="mt-1.5 h-[6px] overflow-hidden rounded-full" style={{ backgroundColor: '#DDE4EC' }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${matchScore}%`, backgroundColor: COLORS.primaryDark }}
                />
              </View>
            </View>

            <View className="flex-1 flex-row rounded-2xl p-3" style={{ backgroundColor: '#E2FAF5' }}>
              <View
                className="h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: COLORS.mint }}
              >
                <MaterialCommunityIcons name="star-four-points" size={18} color={COLORS.primaryDark} />
              </View>
              <View className="ml-2 flex-1">
                <Text className="text-[13px] font-bold" style={{ color: COLORS.primaryDark }}>
                  {getMatchLabel(matchScore)}
                </Text>
                <Text className="mt-0.5 text-[10px]" style={{ color: COLORS.muted }}>
                  Dựa trên sở thích, ngân sách và phong cách của bạn
                </Text>
              </View>
            </View>
          </View>

          {/* Tên & mô tả */}
          <Text className="mt-4 text-[22px] font-extrabold" style={{ color: COLORS.text }}>
            {place.name}
          </Text>
          <View className="mt-1 flex-row items-center">
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={COLORS.primary} />
            <Text className="ml-1 text-[13px]" style={{ color: COLORS.muted }}>
              {place.location}
            </Text>
          </View>
          <Text className="mt-3 text-[13px] leading-5" style={{ color: '#4A5A66' }}>
            {place.description}
          </Text>

          {/* Điểm nổi bật */}
          <Text className="mb-2 mt-5 text-[15px] font-bold" style={{ color: COLORS.text }}>
            Điểm nổi bật
          </Text>
          <View className="flex-row gap-2">
            {place.highlights.map((item) => (
              <View key={item.name} className="flex-1">
                <Image source={{ uri: item.image }} className="h-[72px] w-full rounded-xl" />
                <Text
                  numberOfLines={2}
                  className="mt-1 text-center text-[11px]"
                  style={{ color: COLORS.text }}
                >
                  {item.name}
                </Text>
              </View>
            ))}
          </View>

          {/* Phù hợp với sở thích */}
          <Text className="mb-2 mt-5 text-[15px] font-bold" style={{ color: COLORS.text }}>
            Phù hợp với sở thích của bạn
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {place.tags.map((tag) => {
              const matched = interests.includes(tag);
              return (
                <View
                  key={tag}
                  className="flex-row items-center rounded-full px-3 py-1.5"
                  style={{ backgroundColor: matched ? COLORS.mint : COLORS.lightPurple }}
                >
                  <MaterialCommunityIcons
                    name={matched ? 'check-circle' : 'tag-outline'}
                    size={13}
                    color={matched ? COLORS.primaryDark : COLORS.muted}
                  />
                  <Text
                    className="ml-1 text-[12px] font-semibold"
                    style={{ color: matched ? COLORS.primaryDark : '#445577' }}
                  >
                    {interestTagLabels[tag]}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Thông tin hữu ích */}
          <View className="mt-5 overflow-hidden rounded-2xl" style={{ backgroundColor: COLORS.background }}>
            <Pressable
              onPress={() => setShowInfo((previous) => !previous)}
              className="flex-row items-center justify-between px-4 py-3.5"
            >
              <Text className="text-[14px] font-bold" style={{ color: COLORS.text }}>
                Thông tin hữu ích
              </Text>
              <MaterialCommunityIcons
                name={showInfo ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={COLORS.text}
              />
            </Pressable>

            {showInfo && (
              <View className="px-4 pb-3">
                {infoRows.map((row) => (
                  <View key={row.label} className="flex-row items-center border-t border-[#E6E9F2] py-2.5">
                    <MaterialCommunityIcons name={row.icon} size={18} color={COLORS.primary} />
                    <Text className="ml-2 flex-1 text-[12px]" style={{ color: COLORS.muted }}>
                      {row.label}
                    </Text>
                    <Text
                      className="max-w-[55%] text-right text-[12px] font-bold"
                      style={{ color: COLORS.text }}
                    >
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>




      {/* ================= FOOTER ================= */}

      <View className="bg-white px-4 pb-2 pt-2.5">

        {/* MỚI: Xem danh sách địa điểm đã thêm */}

        <Pressable
          onPress={() => {
            setShowSelectedPlaces(true);
          }}
          accessibilityRole="button"

          className="mb-2.5 h-12 flex-row items-center justify-center rounded-full border border-[#B8EAE3] bg-[#F0FCF9] active:opacity-80"
        >
          <MaterialCommunityIcons
            name="clipboard-list-outline"
            size={20}
            color={COLORS.primaryDark}
          />

          <Text
            className="ml-2 text-[14px] font-bold"
            style={{ color: COLORS.primaryDark }}
          >
            Xem kế hoạch của tôi
            {typeof planCount === 'number'
              ? ` (${planCount})`
              : ''}
          </Text>

          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={COLORS.primaryDark}
            style={{ marginLeft: 6 }}
          />
        </Pressable>

        {/* GIỮ NGUYÊN: Thêm / Bỏ địa điểm khỏi kế hoạch */}
        <Pressable
          onPress={onTogglePlan}
          className="h-12 flex-row items-center justify-center rounded-full active:opacity-80"
          style={{
            backgroundColor: inPlan
              ? COLORS.mint
              : COLORS.primaryDark,
          }}
        >
          <MaterialCommunityIcons
            name={
              inPlan
                ? 'check-circle'
                : 'map-marker-plus-outline'
            }
            size={19}
            color={
              inPlan
                ? COLORS.primaryDark
                : 'white'
            }
          />

          <Text
            className="ml-2 text-[14px] font-bold"
            style={{
              color: inPlan
                ? COLORS.primaryDark
                : 'white',
            }}
          >
            {inPlan
              ? 'Đã thêm vào kế hoạch'
              : 'Thêm vào kế hoạch'}
          </Text>
        </Pressable>

      </View>

    </SafeAreaView>
  );
}
