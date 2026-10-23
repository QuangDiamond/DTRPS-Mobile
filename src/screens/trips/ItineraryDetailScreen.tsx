
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TripLiveMapScreen from './TripLiveMapScreen';


// ==================== TYPES ====================

type IconName =
  React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type Activity = {
  id: string;
  time: string;
  duration: string;
  title: string;
  location: string;
  image: string;
  icon: IconName;
  note: string;
  noteIcon: IconName;
  noteBackground: string;
  noteColor: string;
  transfer?: string;
  estimatedCost?: string;
  category?: string;
};

type TripDay = {
  title: string;
  description: string;
  activities: Activity[];
};

type ItineraryDetailScreenProps = {
  onBack: () => void;
  initialDay?: number;
  tripTitle?: string;
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  budget?: string;
  onStartTripPress?: () => void;
  onAddActivity?: () => void;
  onEditTrip?: () => void;
};

// ==================== COLORS ====================

const C = {
  primary: '#087F78',
  dark: '#006B65',
  darkBlue: '#14364F',
  muted: '#7E8DA7',
  background: '#F8F7FF',
  white: '#FFFFFF',
  lavender: '#EFF0FD',
  mint: '#CCF8EF',
  tealLight: '#E5FBF5',
  border: '#E9EBF7',
  orange: '#D79023',
};

// ==================== DEMO IMAGES ====================

// Ảnh mạng phục vụ mockup.
// Có thể thay bằng ảnh local hoặc dữ liệu API sau này.

const IMAGES = {
  airport:
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80',

  sonTra:
    'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80',

  food:
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',

  beach:
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',

  night:
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&q=80',

  mountain:
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',

  city:
    'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80',
};

// ==================== MOCK ITINERARY ====================

const ITINERARY: TripDay[] = [
  {
    title: 'Chào Đà Nẵng',
    description: 'Khám phá thành phố biển',
    activities: [
      {
        id: 'airport',
        time: '08:30',
        duration: '1h 30m',
        title:
          'Hạ cánh Sân bay Quốc tế Đà Nẵng & Check-in...',
        location: 'Sân bay Quốc tế Đà Nẵng',
        image: IMAGES.airport,
        icon: 'airplane-landing',
        category: 'Di chuyển',
        note:
          'Từ sân bay di chuyển tới khách sạn và gửi hành lý.',
        noteIcon: 'car-outline',
        noteBackground: C.lavender,
        noteColor: '#6474A5',
        transfer:
          'Di chuyển khoảng 20 phút đến bán đảo Sơn Trà',
      },
      {
        id: 'linh-ung',
        time: '10:30',
        duration: '2 giờ',
        title:
          'Bán đảo Sơn Trà & Viếng Chùa Linh Ứng',
        location: 'Chùa Linh Ứng, Sơn Trà',
        image: IMAGES.sonTra,
        icon: 'temple-buddhist',
        category: 'Tham quan',
        note: 'Miễn phí vé vào cổng',
        noteIcon: 'ticket-outline',
        noteBackground: '#DBF9F3',
        noteColor: C.dark,
        transfer:
          'Di chuyển khoảng 25 phút về khu vực ăn trưa',
      },
      {
        id: 'lunch',
        time: '12:30',
        duration: '1h 30m',
        title:
          'Bánh tráng cuốn thịt heo Đại Lộc & Mì Quảng',
        location: 'Ẩm thực truyền thống Đà Nẵng',
        image: IMAGES.food,
        icon: 'food-fork-drink',
        category: 'Ăn uống',
        note: 'Dự kiến: 150.000đ / người',
        noteIcon: 'cash',
        noteBackground: '#F1F0FF',
        noteColor: '#6C70A0',
        estimatedCost: '150.000đ',
        transfer:
          'Nghỉ ngơi và di chuyển ra bãi biển',
      },
      {
        id: 'my-khe',
        time: '15:00',
        duration: '2h 30m',
        title:
          'Tắm biển & Thư giãn tại Bãi biển Mỹ Khê',
        location: 'Bãi biển Mỹ Khê, Đà Nẵng',
        image: IMAGES.beach,
        icon: 'beach',
        category: 'Giải trí',
        note:
          'Bãi biển đẹp, thích hợp nghỉ ngơi và ngắm hoàng hôn.',
        noteIcon: 'weather-sunset',
        noteBackground: '#E2F8F3',
        noteColor: C.dark,
        transfer:
          'Di chuyển tới Cầu Rồng và chợ đêm Helio',
      },
      {
        id: 'dragon-bridge',
        time: '18:30',
        duration: '2 giờ',
        title:
          'Ngắm Cầu Rồng & Dạo chợ đêm Helio',
        location: 'Cầu Rồng, Đà Nẵng',
        image: IMAGES.night,
        icon: 'city-variant-outline',
        category: 'Buổi tối',
        note:
          'Chiêm ngưỡng thành phố về đêm và thưởng thức ẩm thực.',
        noteIcon: 'lightbulb-on-outline',
        noteBackground: '#FFF1E5',
        noteColor: '#B57A31',
      },
    ],
  },

  {
    title: 'Khám phá Bà Nà Hills',
    description: 'Một ngày trên đỉnh núi',
    activities: [
      {
        id: 'day2-1',
        time: '07:30',
        duration: '1 giờ',
        title: 'Ăn sáng và khởi hành tới Bà Nà Hills',
        location: 'Trung tâm Đà Nẵng',
        image: IMAGES.airport,
        icon: 'car-outline',
        category: 'Di chuyển',
        note:
          'Chuẩn bị vé và khởi hành từ khách sạn.',
        noteIcon: 'information-outline',
        noteBackground: C.lavender,
        noteColor: '#6474A5',
        transfer: 'Di chuyển đến khu du lịch Bà Nà',
      },
      {
        id: 'day2-2',
        time: '09:00',
        duration: '2 giờ',
        title: 'Check-in Cầu Vàng Bà Nà Hills',
        location: 'Bà Nà Hills, Đà Nẵng',
        image: IMAGES.mountain,
        icon: 'camera-outline',
        category: 'Check-in',
        note:
          'Chụp ảnh và tham quan khu vực Cầu Vàng.',
        noteIcon: 'camera-outline',
        noteBackground: '#E2F8F3',
        noteColor: C.dark,
        transfer: 'Đi bộ đến khu Làng Pháp',
      },
      {
        id: 'day2-3',
        time: '11:30',
        duration: '2 giờ',
        title: 'Ăn trưa và khám phá Làng Pháp',
        location: 'Khu du lịch Bà Nà Hills',
        image: IMAGES.food,
        icon: 'silverware-fork-knife',
        category: 'Ẩm thực',
        note:
          'Thưởng thức bữa trưa và tham quan kiến trúc.',
        noteIcon: 'food-fork-drink',
        noteBackground: '#FFF3E8',
        noteColor: '#B47A35',
        transfer: 'Tiếp tục tham quan khu vui chơi',
      },
      {
        id: 'day2-4',
        time: '14:30',
        duration: '2 giờ',
        title: 'Khám phá Fantasy Park',
        location: 'Bà Nà Hills',
        image: IMAGES.city,
        icon: 'ferris-wheel',
        category: 'Vui chơi',
        note:
          'Tự do trải nghiệm các trò chơi phù hợp.',
        noteIcon: 'ticket-outline',
        noteBackground: '#E2F8F3',
        noteColor: C.dark,
      },
    ],
  },

  {
    title: 'Biển Mỹ Khê & Mua sắm',
    description: 'Thư giãn và trải nghiệm ẩm thực',
    activities: [
      {
        id: 'day3-1',
        time: '08:00',
        duration: '2 giờ',
        title: 'Dạo biển Mỹ Khê buổi sáng',
        location: 'Bãi biển Mỹ Khê',
        image: IMAGES.beach,
        icon: 'beach',
        category: 'Thư giãn',
        note:
          'Đi dạo, chụp ảnh và ngắm cảnh biển.',
        noteIcon: 'weather-sunny',
        noteBackground: '#E2F8F3',
        noteColor: C.dark,
        transfer: 'Di chuyển đến khu vực chợ Hàn',
      },
      {
        id: 'day3-2',
        time: '10:30',
        duration: '2 giờ',
        title: 'Tham quan Chợ Hàn',
        location: 'Trung tâm Đà Nẵng',
        image: IMAGES.city,
        icon: 'shopping-outline',
        category: 'Mua sắm',
        note:
          'Khám phá các gian hàng và đặc sản địa phương.',
        noteIcon: 'storefront-outline',
        noteBackground: C.lavender,
        noteColor: '#6474A5',
        transfer: 'Di chuyển đến địa điểm ăn trưa',
      },
      {
        id: 'day3-3',
        time: '12:30',
        duration: '1h 30m',
        title: 'Thưởng thức đặc sản Đà Nẵng',
        location: 'Trung tâm Đà Nẵng',
        image: IMAGES.food,
        icon: 'food-fork-drink',
        category: 'Ăn uống',
        note: 'Dự kiến: 180.000đ / người',
        noteIcon: 'cash',
        noteBackground: '#FFF1E5',
        noteColor: '#B57A31',
      },
    ],
  },

  {
    title: 'Tạm biệt Đà Nẵng',
    description: 'Kết thúc hành trình',
    activities: [
      {
        id: 'day4-1',
        time: '08:00',
        duration: '1 giờ',
        title: 'Ăn sáng và trả phòng khách sạn',
        location: 'Trung tâm Đà Nẵng',
        image: IMAGES.food,
        icon: 'coffee-outline',
        category: 'Nghỉ ngơi',
        note: 'Kiểm tra hành lý và trả phòng.',
        noteIcon: 'bag-suitcase-outline',
        noteBackground: C.lavender,
        noteColor: '#6474A5',
        transfer: 'Di chuyển tới sân bay',
      },
      {
        id: 'day4-2',
        time: '10:30',
        duration: '2 giờ',
        title: 'Di chuyển đến sân bay và kết thúc chuyến đi',
        location: 'Sân bay Quốc tế Đà Nẵng',
        image: IMAGES.airport,
        icon: 'airplane-takeoff',
        category: 'Di chuyển',
        note:
          'Hoàn tất hành trình và chuẩn bị chuyến bay.',
        noteIcon: 'check-circle-outline',
        noteBackground: '#E2F8F3',
        noteColor: C.dark,
      },
    ],
  },
];

// ==================== HELPERS ====================

function getDateLabel(startDate: string, offset: number) {
  const [day, month, year] = startDate
    .split('/')
    .map(Number);

  const date = new Date(
    year,
    month - 1,
    day + offset
  );

  return `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;
}

// ==================== ACTIVITY IMAGE ====================

function ActivityImage({
                         uri,
                         icon,
                       }: {
  uri: string;
  icon: IconName;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <View
      style={{
        width: 78,
        height: 78,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#E6F4F2',
      }}
    >
      {imageError ? (
        <View className="h-full w-full items-center justify-center">
          <MaterialCommunityIcons
            name={icon}
            size={33}
            color={C.dark}
          />
        </View>
      ) : (
        <Image
          source={{ uri }}
          resizeMode="cover"
          style={{
            width: '100%',
            height: '100%',
          }}
          onError={() => setImageError(true)}
        />
      )}
    </View>
  );
}

// ==================== TIMELINE ITEM ====================

function TimelineItem({
                        item,
                        isLast,
                      }: {
  item: Activity;
  isLast: boolean;
}) {
  const isEvening = item.id === 'dragon-bridge';

  return (
    <View
      style={{
        paddingLeft: 27,
        marginBottom: 14,
      }}
    >
      {/* CONNECTOR */}

      {!isLast && (
        <View
          style={{
            position: 'absolute',
            left: 8,
            top: 14,
            bottom: -14,
            width: 2,
            backgroundColor: '#BDECE5',
          }}
        />
      )}

      {/* TIMELINE DOT */}

      <View
        style={{
          position: 'absolute',
          top: 9,
          left: 1,
          height: 16,
          width: 16,
          borderRadius: 6,
          backgroundColor: isEvening
            ? '#B98122'
            : C.primary,
          borderWidth: 3,
          borderColor: '#DBF5F0',
        }}
      />

      {/* MAIN CARD */}

      <View
        style={{
          backgroundColor: C.white,
          borderRadius: 17,
          padding: 12,
          borderWidth: 1,
          borderColor: '#EDF0F8',
          elevation: 1,
        }}
      >
        {/* TIME */}

        <View className="flex-row items-center justify-between">
          <Text
            style={{
              color: isEvening
                ? '#AC771B'
                : C.primary,
              fontSize: 17,
              fontWeight: '800',
            }}
          >
            {item.time}
          </Text>

          <View
            className="rounded-full px-3 py-1"
            style={{
              backgroundColor: C.lavender,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: '#8290B0',
                fontWeight: '700',
              }}
            >
              {item.duration}
            </Text>
          </View>
        </View>

        {/* PLACE INFO */}

        <View
          className="mt-2 flex-row"
          style={{
            alignItems: 'flex-start',
          }}
        >
          <ActivityImage
            key={item.id}
            uri={item.image}
            icon={item.icon}
          />

          <View
            style={{
              flex: 1,
              minWidth: 0,
              marginLeft: 11,
            }}
          >
            <Text
              numberOfLines={3}
              style={{
                color: C.darkBlue,
                fontSize: 13,
                fontWeight: '800',
                lineHeight: 18,
              }}
            >
              {item.title}
            </Text>

            <View
              className="mt-2 flex-row items-start"
            >
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={14}
                color={C.primary}
              />

              <Text
                numberOfLines={2}
                style={{
                  flex: 1,
                  marginLeft: 3,
                  color: C.muted,
                  fontSize: 10.5,
                  lineHeight: 15,
                }}
              >
                {item.location}
              </Text>
            </View>
          </View>
        </View>

        {/* CATEGORY / NOTE */}

        <View
          className="mt-3 flex-row items-start rounded-xl px-3 py-2.5"
          style={{
            backgroundColor:
            item.noteBackground,
          }}
        >
          <MaterialCommunityIcons
            name={item.noteIcon}
            size={16}
            color={item.noteColor}
          />

          <Text
            style={{
              flex: 1,
              marginLeft: 7,
              color: item.noteColor,
              fontSize: 10.5,
              fontWeight: '600',
              lineHeight: 16,
            }}
          >
            {item.note}
          </Text>
        </View>
      </View>

      {/* TRANSFER NOTE */}

      {item.transfer && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 9,
            paddingTop: 12,
            paddingBottom: 2,
          }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ECF0FF',
            }}
          >
            <MaterialCommunityIcons
              name="car-outline"
              size={13}
              color="#8394BD"
            />
          </View>

          <Text
            style={{
              marginLeft: 7,
              flex: 1,
              fontSize: 10.5,
              lineHeight: 15,
              color: '#8690AC',
            }}
          >
            {item.transfer}
          </Text>
        </View>
      )}
    </View>
  );
}

// ==================== MAIN SCREEN ====================

export default function ItineraryDetailScreen({
                                                onBack,
                                                initialDay = 1,
                                                tripTitle = 'Tinh Hoa Di Sản & Biển Mỹ Khê',
                                                startDate = '24/10/2026',
                                                endDate = '27/10/2026',
                                                totalDays = 4,
                                                budget = '7.800.000đ',
                                                onStartTripPress,
                                                onAddActivity,
                                                onEditTrip,
                                              }: ItineraryDetailScreenProps) {
  const safeTotalDays = Math.max(
    1,
    Math.min(totalDays, ITINERARY.length)
  );

  const [selectedDay, setSelectedDay] = useState(
    Math.max(
      1,
      Math.min(initialDay, safeTotalDays)
    )
  );

  const [bookmarked, setBookmarked] =
    useState(false);
  const [showTripMap, setShowTripMap] = useState(false);

  const currentDay = ITINERARY[selectedDay - 1];

  // ==================== HANDLERS ====================

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `${tripTitle}\n` +
          `${startDate} - ${endDate}\n` +
          `SmartTravel - Lịch trình du lịch`,
      });
    } catch {
      Alert.alert(
        'Chia sẻ',
        'Không thể mở chức năng chia sẻ.'
      );
    }
  };

  const handleAdd = () => {
    if (onAddActivity) {
      onAddActivity();
      return;
    }

    Alert.alert(
      'Thêm hoạt động',
      'Chức năng thêm hoạt động sẽ được tích hợp sau.'
    );
  };

  const handleEdit = () => {
    if (onEditTrip) {
      onEditTrip();
      return;
    }

    Alert.alert(
      'Chỉnh sửa lịch trình',
      'Chức năng chỉnh sửa sẽ được tích hợp sau.'
    );
  };


  const handleStart = () => {
    // Bắt đầu đúng ngày đang được chọn
    setShowTripMap(true);
  };


// ==================== TRIP LIVE MAP ====================

  if (showTripMap) {
    return (
      <TripLiveMapScreen
        dayNumber={selectedDay}
        dayTitle={currentDay.title}
        activities={currentDay.activities}
        onBack={() => {
          setShowTripMap(false);
        }}
      />
    );
  }

// ==================== RENDER ====================

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{
        backgroundColor: C.background,
      }}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={C.background}
      />

      {/* ==================== HEADER ==================== */}

      <View
        className="h-[56px] flex-row items-center justify-between border-b border-[#ECECF6] bg-white px-3"
      >
        <Pressable
          onPress={onBack}
          accessibilityLabel="Quay lại"
          className="h-10 w-9 items-center justify-center"
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={27}
            color={C.darkBlue}
          />
        </Pressable>

        <Text
          className="ml-1 flex-1 text-[16px] font-extrabold"
          style={{ color: C.darkBlue }}
        >
          Chi Tiết Lịch Trình
        </Text>

        <Pressable
          onPress={handleShare}
          accessibilityLabel="Chia sẻ lịch trình"
          className="h-9 w-9 items-center justify-center"
        >
          <MaterialCommunityIcons
            name="share-variant-outline"
            size={20}
            color={C.darkBlue}
          />
        </Pressable>

        <Pressable
          onPress={() =>
            setBookmarked(previous => !previous)
          }
          accessibilityLabel="Lưu lịch trình"
          className="h-9 w-9 items-center justify-center"
        >
          <MaterialCommunityIcons
            name={
              bookmarked
                ? 'bookmark'
                : 'bookmark-outline'
            }
            size={21}
            color={
              bookmarked ? C.primary : C.darkBlue
            }
          />
        </Pressable>

        <View
          className="ml-1 h-9 w-9 items-center justify-center rounded-full"
          style={{
            backgroundColor: C.dark,
          }}
        >
          <MaterialCommunityIcons
            name="account-outline"
            size={22}
            color="white"
          />
        </View>
      </View>

      {/* ==================== SCROLL CONTENT ==================== */}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 15,
          paddingTop: 17,
          paddingBottom: 20,
        }}
      >
        {/* ==================== TRIP HEADER ==================== */}

        <View>
          {/* BADGES */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              alignItems: 'center',
              gap: 8,
            }}
          >
            <View className="flex-row items-center rounded-full bg-[#D9F8F0] px-3 py-1.5">
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={15}
                color={C.dark}
              />

              <Text
                className="ml-1 text-[11px] font-bold"
                style={{ color: C.dark }}
              >
                Đà Nẵng - Hội An · {safeTotalDays} ngày
              </Text>
            </View>

            <View className="flex-row items-center rounded-full bg-[#FFF0DD] px-3 py-1.5">
              <MaterialCommunityIcons
                name="star-four-points"
                size={14}
                color="#B77923"
              />

              <Text className="ml-1 text-[11px] font-bold text-[#B77923]">
                AI Tối ưu
              </Text>
            </View>
          </ScrollView>

          {/* TRIP TITLE */}

          <Text
            className="mt-3 text-[22px] font-extrabold leading-[29px]"
            style={{ color: C.darkBlue }}
          >
            {tripTitle}
          </Text>

          <Text
            className="mt-1 text-[12px]"
            style={{ color: C.muted }}
          >
            Khởi hành: {startDate} - Kết thúc: {endDate}
          </Text>
        </View>

        {/* ==================== SUMMARY CARDS ==================== */}

        <View className="mt-4 flex-row gap-3">
          {/* BUDGET */}

          <View
            className="min-w-0 flex-1 flex-row items-center rounded-2xl p-3"
            style={{
              backgroundColor: '#F0F1FF',
            }}
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-[#E1E7FF]">
              <MaterialCommunityIcons
                name="wallet-outline"
                size={22}
                color="#7686C0"
              />
            </View>

            <View className="ml-2 min-w-0 flex-1">
              <Text className="text-[10px] text-[#8592B0]">
                Dự kiến ngân sách
              </Text>

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                className="mt-1 text-[15px] font-extrabold"
                style={{
                  color: C.darkBlue,
                }}
              >
                {budget}
              </Text>
            </View>
          </View>

          {/* WEATHER */}

          <View
            className="min-w-0 flex-1 flex-row items-center rounded-2xl p-3"
            style={{
              backgroundColor: '#F0F1FF',
            }}
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-[#E4E9FF]">
              <MaterialCommunityIcons
                name="weather-partly-cloudy"
                size={24}
                color="#DCA550"
              />
            </View>

            <View className="ml-2 min-w-0 flex-1">
              <Text className="text-[10px] text-[#8592B0]">
                Dự báo thời tiết
              </Text>

              <Text
                numberOfLines={1}
                className="mt-1 text-[15px] font-extrabold"
                style={{ color: C.darkBlue }}
              >
                27°C, Nắng nhẹ
              </Text>
            </View>
          </View>
        </View>

        {/* ==================== ITINERARY TITLE ==================== */}

        <View className="mb-3 mt-6 flex-row items-center justify-between">
          <Text
            className="text-[17px] font-extrabold"
            style={{ color: C.darkBlue }}
          >
            Lịch trình chi tiết
          </Text>

          <Text
            className="text-[11px] font-semibold"
            style={{ color: C.primary }}
          >
            {safeTotalDays} ngày trong lịch trình
          </Text>
        </View>

        {/* ==================== DAY TABS ==================== */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-5"
          contentContainerStyle={{
            gap: 8,
            paddingRight: 12,
          }}
        >
          {ITINERARY.slice(0, safeTotalDays).map(
            (day, index) => {
              const number = index + 1;
              const active = selectedDay === number;

              return (
                <Pressable
                  key={number}
                  onPress={() => setSelectedDay(number)}
                  className="flex-row items-center rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: active
                      ? C.dark
                      : '#F0F1FF',
                  }}
                >
                  <MaterialCommunityIcons
                    name="calendar-today"
                    size={16}
                    color={
                      active
                        ? C.white
                        : '#8592AF'
                    }
                  />

                  <Text
                    className="ml-2 text-[12px] font-extrabold"
                    style={{
                      color: active
                        ? C.white
                        : '#667895',
                    }}
                  >
                    Ngày {number} ({getDateLabel(
                    startDate,
                    index
                  )}) - {day.title}
                  </Text>
                </Pressable>
              );
            }
          )}
        </ScrollView>

        {/* ==================== CURRENT DAY ==================== */}

        <View className="mb-4">
          <Text
            className="text-[14px] font-extrabold"
            style={{ color: C.darkBlue }}
          >
            Ngày {selectedDay}: {currentDay.title}
          </Text>

          <Text
            className="mt-1 text-[11px]"
            style={{ color: C.muted }}
          >
            {currentDay.description} ·{' '}
            {currentDay.activities.length} hoạt động
          </Text>
        </View>

        {/* ==================== TIMELINE ==================== */}

        <View>
          {currentDay.activities.map(
            (activity, index) => (
              <TimelineItem
                key={activity.id}
                item={activity}
                isLast={
                  index ===
                  currentDay.activities.length - 1
                }
              />
            )
          )}
        </View>
      </ScrollView>

      {/* ==================== FIXED FOOTER ==================== */}

      <View
        className="flex-row items-center border-t border-[#E7EAF5] bg-white px-3 py-2.5"
      >
        {/* ADD */}

        <Pressable
          onPress={handleAdd}
          className="mr-2 h-[52px] w-[52px] items-center justify-center rounded-2xl"
          style={{
            backgroundColor: '#EFF0FF',
          }}
        >
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={20}
            color="#7283AC"
          />

          <Text className="mt-0.5 text-[9px] font-bold text-[#7283AC]">
            Thêm
          </Text>
        </Pressable>

        {/* EDIT */}

        <Pressable
          onPress={handleEdit}
          className="mr-2 h-[52px] w-[52px] items-center justify-center rounded-2xl"
          style={{
            backgroundColor: '#EFF0FF',
          }}
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={20}
            color="#7283AC"
          />

          <Text className="mt-0.5 text-[9px] font-bold text-[#7283AC]">
            Sửa
          </Text>
        </Pressable>

        {/* START TRIP */}

        <Pressable
          onPress={handleStart}
          accessibilityRole="button"
          className="h-[52px] min-w-0 flex-1 flex-row items-center justify-center rounded-full"
          style={{
            backgroundColor: C.dark,
            elevation: 2,
          }}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            className="text-[14px] font-extrabold text-white"
          >
            Bắt đầu chuyến đi
          </Text>

          <MaterialCommunityIcons
            name="arrow-right"
            size={21}
            color="white"
            style={{ marginLeft: 8 }}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
