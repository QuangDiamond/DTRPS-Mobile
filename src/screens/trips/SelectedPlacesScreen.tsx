
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
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
};

// FIX: Khai báo props để nhận onBack từ SuggestionDetailScreen
type SelectedPlacesScreenProps = {
  onBack: () => void;
};

// ==================== COLORS ====================

const COLORS = {
  primary: '#087A78',
  primaryDark: '#075C66',
  text: '#13364A',
  muted: '#72818C',
  background: '#FAF9FF',
  mint: '#C3F8F0',
  purple: '#F0F1FF',
  white: '#FFFFFF',
};

// ==================== MOCK DATA ====================

// Dữ liệu hardcode, chưa cần API hoặc Backend

const MOCK_PLACES: PlanPlace[] = [
  {
    id: 'son-tra',
    name: 'Bán đảo Sơn Trà',
    location: 'Sơn Trà, Đà Nẵng',
    description:
      'Phù hợp với sở thích thiên nhiên, cảnh biển tuyệt đẹp.',
    image:
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=600',
    tags: ['Thiên nhiên', 'Biển'],
  },
  {
    id: 'linh-ung',
    name: 'Chùa Linh Ứng',
    location: 'Sơn Trà, Đà Nẵng',
    description:
      'Ngôi chùa nổi tiếng linh thiêng, vừa có cảnh đẹp vừa yên bình.',
    image:
      'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=600',
    tags: ['Văn hóa', 'Thiên nhiên'],
  },
  {
    id: 'ban-co',
    name: 'Đỉnh Bàn Cờ',
    location: 'Sơn Trà, Đà Nẵng',
    description:
      'Điểm ngắm toàn cảnh thành phố tuyệt đẹp, không khí trong lành.',
    image:
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600',
    tags: ['Thiên nhiên', 'Ngắm cảnh'],
  },
];

// ==================== INFO CHIP ====================

function InfoChip({
                    icon,
                    title,
                  }: {
  icon: IconName;
  title: string;
}) {
  return (
    <View className="mb-2 mr-2 flex-row items-center rounded-full bg-[#EBEDFF] px-3 py-2">
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color="#42647E"
      />

      <Text className="ml-1.5 text-[11px] font-semibold text-[#506581]">
        {title}
      </Text>
    </View>
  );
}

// ==================== PLACE CARD ====================

function PlaceCard({
                     place,
                     index,
                     onRemove,
                   }: {
  place: PlanPlace;
  index: number;
  onRemove: () => void;
}) {
  return (
    <View
      className="mb-3 flex-row rounded-[20px] border border-[#ECEEFA] bg-white p-2.5"
      style={{ elevation: 2 }}
    >
      {/* ==================== IMAGE ==================== */}

      <View
        className="overflow-hidden rounded-2xl bg-[#DAF2EA]"
        style={{
          width: 112,
          height: 152,
        }}
      >
        <Image
          source={{ uri: place.image }}
          className="h-full w-full"
          resizeMode="cover"
        />

        {/* NUMBER */}

        <View
          className="absolute left-2 top-2 h-9 w-9 items-center justify-center rounded-full"
          style={{
            backgroundColor: '#10A99B',
          }}
        >
          <Text className="text-[18px] font-extrabold text-white">
            {index + 1}
          </Text>
        </View>
      </View>

      {/* ==================== CONTENT ==================== */}

      <View className="ml-3 min-w-0 flex-1">
        <View className="flex-row items-start justify-between">
          <Text
            className="min-w-0 flex-1 text-[16px] font-extrabold leading-[21px]"
            style={{ color: COLORS.text }}
            numberOfLines={2}
          >
            {place.name}
          </Text>

          {/* MORE BUTTON */}

          <Pressable
            onPress={onRemove}
            className="ml-1 h-8 w-8 items-center justify-center rounded-full bg-[#F0F1FF]"
            accessibilityLabel={`Xóa ${place.name}`}
          >
            <MaterialCommunityIcons
              name="dots-vertical"
              size={21}
              color={COLORS.text}
            />
          </Pressable>
        </View>

        {/* ==================== LOCATION ==================== */}

        <View className="mt-2 flex-row items-center">
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={16}
            color={COLORS.primary}
          />

          <Text
            className="ml-1 flex-1 text-[11px]"
            style={{ color: COLORS.muted }}
            numberOfLines={1}
          >
            {place.location}
          </Text>
        </View>

        {/* ==================== DESCRIPTION ==================== */}

        <Text
          className="mt-2 text-[11px] leading-[17px]"
          style={{ color: COLORS.muted }}
          numberOfLines={3}
        >
          {place.description}
        </Text>

        {/* ==================== TAGS ==================== */}

        <View className="mt-3 flex-row flex-wrap">
          {place.tags.map(tag => (
            <View
              key={tag}
              className="mb-1 mr-1 flex-row items-center rounded-full bg-[#F0F1FF] px-2 py-1.5"
            >
              <MaterialCommunityIcons
                name="tag-outline"
                size={12}
                color="#54708A"
              />

              <Text className="ml-1 text-[10px] font-medium text-[#516987]">
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ==================== MAIN SCREEN ====================

// FIX: Nhận prop onBack từ màn SuggestionDetailScreen
export default function SelectedPlacesScreen({
                                               onBack,
                                             }: SelectedPlacesScreenProps) {

  const [places, setPlaces] =
    useState<PlanPlace[]>(MOCK_PLACES);

  const selectedCount = places.length;

  // ==================== HANDLERS ====================

  // FIX: Quay lại màn chi tiết địa điểm
  const handleBack = () => {
    onBack();
  };

  // Xóa địa điểm khỏi danh sách hardcode
  const handleRemove = (place: PlanPlace) => {
    Alert.alert(
      'Xóa địa điểm',
      `Bạn có chắc muốn xóa "${place.name}" khỏi kế hoạch?`,
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
              previous.filter(
                item => item.id !== place.id
              )
            );
          },
        },
      ]
    );
  };

  // Thêm địa điểm (demo)
  const handleAddPlace = () => {
    Alert.alert(
      'Thêm địa điểm',
      'Chức năng thêm địa điểm từ AI sẽ được kết nối sau.'
    );
  };

  // Tiếp tục tạo lịch trình (demo)
  const handleContinue = () => {
    if (selectedCount === 0) {
      Alert.alert(
        'Chưa có địa điểm',
        'Hãy thêm ít nhất một địa điểm vào kế hoạch.'
      );
      return;
    }

    Alert.alert(
      'Tạo lịch trình',
      `Bạn đã chọn ${selectedCount} địa điểm. Chức năng tạo lịch trình sẽ được tích hợp sau.`
    );
  };

  // ==================== RENDER ====================

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{
        backgroundColor: COLORS.background,
      }}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />

      {/* ==================== HEADER ==================== */}

      <View className="h-[65px] flex-row items-center justify-between bg-white px-4">

        {/* BACK BUTTON */}

        <Pressable
          onPress={handleBack}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#F0F1FF]"
          accessibilityLabel="Quay lại"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={COLORS.text}
          />
        </Pressable>

        {/* TITLE */}

        <Text
          className="text-[19px] font-extrabold"
          style={{ color: COLORS.text }}
        >
          Kế hoạch của tôi
        </Text>

        {/* CONTINUE ICON */}

        <Pressable
          onPress={handleContinue}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#F0F1FF]"
          accessibilityLabel="Tiếp tục tạo lịch trình"
        >
          <MaterialCommunityIcons
            name="clipboard-check-outline"
            size={23}
            color={COLORS.text}
          />
        </Pressable>
      </View>

      {/* ==================== MAIN CONTENT ==================== */}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 15,
          paddingTop: 16,
          paddingBottom: 25,
        }}
      >

        {/* ==================== AI SUMMARY ==================== */}

        <LinearGradient
          colors={['#E4FAF6', '#E2F8F8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 22,
            padding: 17,
          }}
        >
          <View className="flex-row items-center">

            <View className="mr-3 h-[65px] w-[65px] items-center justify-center rounded-full bg-[#CBF5EF]">
              <MaterialCommunityIcons
                name="map-marker"
                size={34}
                color={COLORS.primary}
              />
            </View>

            <View className="min-w-0 flex-1">
              <Text
                className="text-[18px] font-extrabold"
                style={{ color: COLORS.primaryDark }}
              >
                Gợi ý hành trình của AI
              </Text>

              <Text className="mt-1 text-[14px] text-[#7C8DA3]">
                {selectedCount} địa điểm đã thêm
              </Text>
            </View>
          </View>

          {/* ==================== INFO CHIPS ==================== */}

          <View className="mt-4 flex-row flex-wrap">
            <InfoChip
              icon="clock-outline"
              title="Trong ngày"
            />

            <InfoChip
              icon="map-marker-outline"
              title="Ưu tiên gần nhau"
            />

            <InfoChip
              icon="star-outline"
              title="Phù hợp 80%"
            />
          </View>
        </LinearGradient>

        {/* ==================== SECTION TITLE ==================== */}

        <View className="mb-4 mt-7 flex-row items-center justify-between">
          <Text
            className="text-[21px] font-extrabold"
            style={{ color: COLORS.text }}
          >
            Địa điểm đã chọn
          </Text>

          <View className="rounded-full bg-[#D5F7F1] px-3 py-1">
            <Text
              className="text-[12px] font-bold"
              style={{ color: COLORS.primaryDark }}
            >
              {selectedCount}
            </Text>
          </View>
        </View>

        {/* ==================== PLACE LIST ==================== */}

        {places.length > 0 ? (
          places.map((place, index) => (
            <PlaceCard
              key={place.id}
              place={place}
              index={index}
              onRemove={() => handleRemove(place)}
            />
          ))
        ) : (
          <View className="items-center rounded-[20px] bg-white px-5 py-10">
            <MaterialCommunityIcons
              name="map-marker-off-outline"
              size={50}
              color="#91CCC2"
            />

            <Text
              className="mt-3 text-[16px] font-bold"
              style={{ color: COLORS.text }}
            >
              Chưa có địa điểm nào
            </Text>

            <Text className="mt-2 text-center text-[12px] text-[#8191A5]">
              Hãy thêm địa điểm vào kế hoạch của bạn.
            </Text>
          </View>
        )}

        {/* ==================== HELPFUL NOTE ==================== */}

        <View className="mt-2 flex-row rounded-2xl bg-[#F0F1FF] p-4">
          <MaterialCommunityIcons
            name="lightbulb-on-outline"
            size={24}
            color={COLORS.primary}
          />

          <Text
            className="ml-3 min-w-0 flex-1 text-[12px] leading-[19px]"
            style={{ color: '#5C6F87' }}
          >
            Bạn có thể sắp xếp lại thứ tự hoặc tiếp tục tạo lịch trình dựa trên các địa điểm đã chọn.
          </Text>
        </View>

      </ScrollView>

      {/* ==================== BOTTOM ACTIONS ==================== */}

      <View className="flex-row border-t border-[#EDF0F7] bg-white px-4 py-3">

        {/* ==================== ADD PLACE ==================== */}

        <Pressable
          onPress={handleAddPlace}
          className="mr-2 h-[54px] flex-1 flex-row items-center justify-center rounded-full bg-[#F0F1FF] px-2"
        >
          <MaterialCommunityIcons
            name="plus-circle"
            size={20}
            color={COLORS.text}
          />

          <Text
            className="ml-2 text-[12px] font-extrabold"
            style={{ color: COLORS.text }}
            numberOfLines={1}
          >
            Thêm địa điểm
          </Text>
        </Pressable>

        {/* ==================== CONTINUE PLAN ==================== */}

        <Pressable
          onPress={handleContinue}
          className="h-[54px] flex-1 flex-row items-center justify-center rounded-full px-2"
          style={{
            backgroundColor: COLORS.mint,
          }}
        >
          <MaterialCommunityIcons
            name="arrow-right-circle"
            size={20}
            color={COLORS.primaryDark}
          />

          <Text
            className="ml-2 flex-1 text-center text-[12px] font-extrabold"
            style={{ color: COLORS.primaryDark }}
            numberOfLines={2}
          >
            Tiếp tục tạo lịch trình
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
