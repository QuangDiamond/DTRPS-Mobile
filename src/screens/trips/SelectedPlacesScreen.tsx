
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ==================== TYPES ====================

type IconName =
  React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type PlanPlace = {
  id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  tags: string[];
  rating: number;
  duration: string;
};

type SelectedPlacesScreenProps = {
  onBack: () => void;
};

// ==================== COLORS ====================

const C = {
  primary: '#087A78',
  dark: '#075C66',
  title: '#173B49',
  muted: '#718493',
  background: '#F7FAFA',
  mint: '#C3F8F0',
  border: '#E7EFEE',
  orange: '#F5A23D',
  white: '#FFFFFF',
};

// ==================== MOCK DATA ====================

const MOCK_PLACES: PlanPlace[] = [
  {
    id: 'son-tra',
    name: 'Bán đảo Sơn Trà',
    location: 'Sơn Trà, Đà Nẵng',
    description:
      'Khám phá bán đảo xanh mát với cảnh biển tuyệt đẹp và không khí trong lành.',
    image:
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=900',
    tags: ['Thiên nhiên', 'Biển'],
    rating: 4.8,
    duration: '90–120 phút',
  },
  {
    id: 'linh-ung',
    name: 'Chùa Linh Ứng',
    location: 'Bãi Bụt, Sơn Trà, Đà Nẵng',
    description:
      'Ngôi chùa nổi tiếng với không gian thanh bình, kiến trúc đẹp và tầm nhìn ra biển.',
    image:
      'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=900',
    tags: ['Văn hóa', 'Tâm linh'],
    rating: 4.7,
    duration: '60–90 phút',
  },
  {
    id: 'ban-co',
    name: 'Đỉnh Bàn Cờ',
    location: 'Bán đảo Sơn Trà, Đà Nẵng',
    description:
      'Điểm ngắm toàn cảnh thành phố Đà Nẵng từ trên cao, lý tưởng để chụp ảnh.',
    image:
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900',
    tags: ['Ngắm cảnh', 'Khám phá'],
    rating: 4.6,
    duration: '60–90 phút',
  },
];

// ==================== SMALL COMPONENTS ====================

function Rating({
                  value,
                }: {
  value: number;
}) {
  return (
    <View className="flex-row items-center">
      <MaterialCommunityIcons
        name="star"
        size={16}
        color={C.orange}
      />

      <Text
        className="ml-1 text-[12px] font-bold"
        style={{ color: C.orange }}
      >
        {value.toFixed(1)}
      </Text>

      <Text className="ml-1 text-[10px] text-[#91A1AB]">
        Mẫu
      </Text>
    </View>
  );
}

// ==================== PLACE CARD ====================

function PlaceCard({
                     place,
                     index,
                     isLast,
                     onRemove,
                   }: {
  place: PlanPlace;
  index: number;
  isLast: boolean;
  onRemove: () => void;
}) {
  return (
    <View className="flex-row">
      {/* TIMELINE NUMBER */}

      <View
        style={{
          width: 40,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: C.dark,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3,
            borderColor: '#D7F4ED',
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 11,
              fontWeight: '800',
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>

        {!isLast && (
          <View
            style={{
              width: 2,
              flex: 1,
              marginTop: 7,
              marginBottom: 3,
              backgroundColor: '#BDE6DF',
              borderRadius: 4,
            }}
          />
        )}
      </View>

      {/* CARD */}

      <View
        className="mb-4 ml-2 flex-1 overflow-hidden rounded-[20px] bg-white"
        style={{
          borderWidth: 1,
          borderColor: C.border,
          elevation: 2,
        }}
      >
        {/* COVER PHOTO */}

        <View style={{ height: 150 }}>
          <Image
            source={{ uri: place.image }}
            resizeMode="cover"
            style={StyleSheet.absoluteFillObject}
          />

          <LinearGradient
            colors={[
              'rgba(0,0,0,0.03)',
              'rgba(4,35,43,0.75)',
            ]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* TOP LABEL */}

          <View className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5">
            <Text
              className="text-[10px] font-bold"
              style={{ color: C.dark }}
            >
              ĐIỂM DỪNG {String(index + 1).padStart(2, '0')}
            </Text>
          </View>

          {/* DELETE BUTTON */}

          <Pressable
            onPress={onRemove}
            className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-white/90"
            accessibilityLabel={`Xóa ${place.name}`}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={19}
              color="#B44D55"
            />
          </Pressable>

          {/* PLACE TITLE ON PHOTO */}

          <View className="absolute bottom-3 left-4 right-3">
            <Text
              className="text-[19px] font-extrabold text-white"
              numberOfLines={2}
            >
              {place.name}
            </Text>
          </View>
        </View>

        {/* CARD CONTENT */}

        <View className="p-3.5">
          {/* LOCATION & RATING */}

          <View className="flex-row items-center justify-between">
            <View className="mr-2 min-w-0 flex-1 flex-row items-center">
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={17}
                color={C.primary}
              />

              <Text
                className="ml-1 flex-1 text-[11px]"
                style={{ color: C.muted }}
                numberOfLines={1}
              >
                {place.location}
              </Text>
            </View>

            <Rating value={place.rating} />
          </View>

          {/* DESCRIPTION */}

          <Text
            className="mt-3 text-[12px] leading-[19px]"
            style={{ color: '#536A78' }}
            numberOfLines={3}
          >
            {place.description}
          </Text>

          {/* TAGS */}

          <View className="mt-3 flex-row flex-wrap">
            {place.tags.map(tag => (
              <View
                key={tag}
                className="mb-1 mr-2 rounded-full bg-[#F0F3FF] px-3 py-1.5"
              >
                <Text className="text-[10px] font-semibold text-[#596B8B]">
                  {tag}
                </Text>
              </View>
            ))}
          </View>

          {/* FOOTER INFO */}

          <View
            className="mt-3 flex-row items-center justify-between pt-3"
            style={{
              borderTopWidth: 1,
              borderTopColor: '#EDF1F4',
            }}
          >
            <View className="flex-row items-center">
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color={C.primary}
              />

              <Text
                className="ml-1.5 text-[11px] font-semibold"
                style={{ color: C.muted }}
              >
                {place.duration}
              </Text>
            </View>

            <View className="flex-row items-center">
              <MaterialCommunityIcons
                name="check-circle"
                size={15}
                color={C.primary}
              />

              <Text
                className="ml-1 text-[11px] font-bold"
                style={{ color: C.dark }}
              >
                Đã chọn
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ==================== MAIN SCREEN ====================

export default function SelectedPlacesScreen({
                                               onBack,
                                             }: SelectedPlacesScreenProps) {
  const [places, setPlaces] =
    useState<PlanPlace[]>(MOCK_PLACES);

  const selectedCount = places.length;

  // ==================== HANDLERS ====================

  const handleRemove = (place: PlanPlace) => {
    Alert.alert(
      'Xóa địa điểm',
      `Bạn có muốn xóa "${place.name}" khỏi kế hoạch không?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setPlaces(previous =>
              previous.filter(item => item.id !== place.id)
            );
          },
        },
      ]
    );
  };

  const handleAddPlace = () => {
    const missingCount =
      MOCK_PLACES.length - places.length;

    if (missingCount === 0) {
      Alert.alert(
        'Thêm địa điểm',
        'Bản demo hiện đã có đủ 3 địa điểm mẫu. Chức năng thêm từ AI sẽ được kết nối sau.'
      );
      return;
    }

    Alert.alert(
      'Thêm địa điểm',
      `Bạn muốn khôi phục ${missingCount} địa điểm mẫu đã xóa?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Khôi phục',
          onPress: () => setPlaces(MOCK_PLACES),
        },
      ]
    );
  };

  const handleCreateTrip = () => {
    if (selectedCount === 0) {
      Alert.alert(
        'Chưa có địa điểm',
        'Vui lòng chọn ít nhất một địa điểm.'
      );
      return;
    }

    Alert.alert(
      'Tạo lịch trình',
      `Đã chọn ${selectedCount} địa điểm. Chức năng tạo lịch trình sẽ được tích hợp sau.`
    );
  };

  // ==================== RENDER ====================

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{ backgroundColor: C.background }}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={C.background}
      />

      {/* ==================== HEADER ==================== */}

      <View className="h-[64px] flex-row items-center justify-between bg-white px-4">
        <Pressable
          onPress={onBack}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F6F7]"
          accessibilityLabel="Quay lại"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={23}
            color={C.title}
          />
        </Pressable>

        <View className="items-center">
          <Text
            className="text-[17px] font-extrabold"
            style={{ color: C.title }}
          >
            Kế hoạch của tôi
          </Text>

          <Text className="mt-0.5 text-[10px] text-[#8A9BA4]">
            Các địa điểm đã lựa chọn
          </Text>
        </View>

        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: '#E3F8F3' }}
        >
          <MaterialCommunityIcons
            name="clipboard-check-outline"
            size={21}
            color={C.dark}
          />
        </View>
      </View>

      {/* ==================== MAIN CONTENT ==================== */}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 24,
        }}
      >
        {/* ==================== HERO ==================== */}

        <LinearGradient
          colors={['#086D69', '#0EA69A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: 19,
            borderRadius: 22,
            overflow: 'hidden',
          }}
        >
          {/* BACKGROUND DECORATION */}

          <View
            style={{
              position: 'absolute',
              right: -30,
              top: -35,
              width: 155,
              height: 155,
              borderRadius: 90,
              borderWidth: 32,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          />

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center rounded-full bg-white/20 px-3 py-1.5">
              <MaterialCommunityIcons
                name="star-four-points"
                size={14}
                color="white"
              />

              <Text className="ml-1.5 text-[10px] font-bold tracking-wide text-white">
                GỢI Ý TỪ AI
              </Text>
            </View>

            <View className="rounded-full bg-white/20 px-3 py-1.5">
              <Text className="text-[10px] font-bold text-white">
                BẢN DEMO
              </Text>
            </View>
          </View>

          <Text className="mt-4 text-[23px] font-extrabold text-white">
            Hành trình Sơn Trà
          </Text>

          <Text className="mt-2 text-[12px] leading-[19px] text-[#E3FAF5]">
            Những điểm dừng thú vị cho chuyến khám phá Đà Nẵng của bạn.
          </Text>

          <View className="mt-5 flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <MaterialCommunityIcons
                name="map-marker-multiple-outline"
                size={23}
                color="white"
              />
            </View>

            <View className="ml-3">
              <Text className="text-[20px] font-extrabold text-white">
                {selectedCount}
              </Text>

              <Text className="text-[10px] text-[#E0F8F4]">
                Địa điểm đã chọn
              </Text>
            </View>

            <View className="ml-auto flex-row items-center rounded-full bg-white/15 px-3 py-2">
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={15}
                color="#C5FFF4"
              />

              <Text className="ml-1 text-[10px] font-semibold text-white">
                Sẵn sàng lên kế hoạch
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ==================== SECTION HEADING ==================== */}

        <View className="mb-4 mt-7">
          <View className="flex-row items-center justify-between">
            <Text
              className="text-[20px] font-extrabold"
              style={{ color: C.title }}
            >
              Các điểm dừng
            </Text>

            <View className="rounded-full bg-[#E2F8F3] px-3 py-1.5">
              <Text
                className="text-[11px] font-bold"
                style={{ color: C.dark }}
              >
                {selectedCount} địa điểm
              </Text>
            </View>
          </View>

          <Text className="mt-1 text-[12px] text-[#81939E]">
            Danh sách địa điểm trong kế hoạch của bạn
          </Text>
        </View>

        {/* ==================== TIMELINE LIST ==================== */}

        {places.length > 0 ? (
          places.map((place, index) => (
            <PlaceCard
              key={place.id}
              place={place}
              index={index}
              isLast={index === places.length - 1}
              onRemove={() => handleRemove(place)}
            />
          ))
        ) : (
          <View className="items-center rounded-[20px] bg-white px-6 py-10">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-[#E2F8F3]">
              <MaterialCommunityIcons
                name="map-marker-off-outline"
                size={32}
                color={C.primary}
              />
            </View>

            <Text
              className="mt-4 text-[16px] font-bold"
              style={{ color: C.title }}
            >
              Chưa có địa điểm nào
            </Text>

            <Text className="mt-2 text-center text-[12px] leading-[19px] text-[#81939E]">
              Thêm các địa điểm thú vị để bắt đầu xây dựng hành trình.
            </Text>
          </View>
        )}

        {/* ==================== NOTE ==================== */}

        {selectedCount > 0 && (
          <View className="mt-1 flex-row rounded-2xl bg-[#EDF8F5] p-4">
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={21}
              color={C.primary}
            />

            <Text
              className="ml-3 flex-1 text-[11px] leading-[18px]"
              style={{ color: '#52736F' }}
            >
              Đây là danh sách địa điểm đã chọn. Bạn có thể bỏ bớt điểm dừng trước khi tạo lịch trình.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ==================== FIXED BOTTOM BAR ==================== */}

      <View
        className="flex-row items-center bg-white px-4 py-3"
        style={{
          borderTopWidth: 1,
          borderTopColor: '#EAF0EF',
        }}
      >
        {/* ADD PLACE */}

        <Pressable
          onPress={handleAddPlace}
          className="mr-2 h-[52px] flex-1 flex-row items-center justify-center rounded-2xl border border-[#CFE8E2] bg-[#F2FAF8]"
        >
          <MaterialCommunityIcons
            name="plus"
            size={20}
            color={C.dark}
          />

          <Text
            className="ml-1 text-[12px] font-bold"
            style={{ color: C.dark }}
          >
            Thêm địa điểm
          </Text>
        </Pressable>

        {/* CREATE TRIP */}

        <Pressable
          onPress={handleCreateTrip}
          disabled={selectedCount === 0}
          className="h-[52px] flex-1 flex-row items-center justify-center rounded-2xl"
          style={{
            backgroundColor:
              selectedCount > 0
                ? C.dark
                : '#CBD5D8',
          }}
        >
          <Text className="text-[12px] font-bold text-white">
            Tạo lịch trình
          </Text>

          <MaterialCommunityIcons
            name="arrow-right"
            size={18}
            color="white"
            style={{ marginLeft: 6 }}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
