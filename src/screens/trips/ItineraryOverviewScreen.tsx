
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ItineraryDetailScreen from './ItineraryDetailScreen';

// ==================== TYPES ====================

type IconName =
  React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type ItineraryOverviewScreenProps = {
  onBack: () => void;
  onViewDetail?: (dayNumber?: number) => void;
  onViewMap?: () => void;
};

type ItineraryDay = {
  day: number;
  date: string;
  count: number;
  title: string;
  subtitle: string;
  icon: IconName;
  image: string;
};

// ==================== COLORS ====================

const C = {
  primary: '#087D78',
  dark: '#006D67',
  title: '#14233F',
  muted: '#7886A5',
  background: '#F5F5FF',
  pale: '#F1F2FC',
  mint: '#C9F5E9',
  border: '#E8EBFB',
  white: '#FFFFFF',
};

// ==================== IMAGES ====================

// Ảnh minh họa địa điểm từ Wikimedia Commons.

const IMAGES = {
  goldenBridge:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a5/The_Golden_Bridge%2C_Ba_Na_Hills%2C_Vietnam.jpg/960px-The_Golden_Bridge%2C_Ba_Na_Hills%2C_Vietnam.jpg',

  linhUng:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Lady_Buddha_Statue_at_Linh_Ung_Pagoda.jpg/250px-Lady_Buddha_Statue_at_Linh_Ung_Pagoda.jpg',

  myKhe:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/My_Khe_Beach%2C_Da_Nang%2C_Vietnam.jpg/960px-My_Khe_Beach%2C_Da_Nang%2C_Vietnam.jpg',
};

// ==================== DEMO ITINERARY ====================

// Nội dung minh họa theo ảnh thiết kế.

const TRIP = {
  name: 'Hành trình Đà Nẵng 3N2Đ',
  startDate: '24/10/2024',
  endDate: '26/10/2024',
  duration: '3 ngày 2 đêm',
  destination: 'Đà Nẵng',
  totalPlaces: 12,
  budget: '~ 7.800.000đ',
  distance: '~ 27 km',
  travelerCount: 1,
  startPoint: 'Sân bay Quốc tế Đà Nẵng (DAD)',
  endPoint: 'Sân bay Quốc tế Đà Nẵng (DAD)',
  style: 'Khám phá - Ẩm thực - Nghỉ dưỡng',
  audience: 'Gia đình, cặp đôi, nhóm bạn',
};

// ==================== DAYS ====================

const DAYS: ItineraryDay[] = [
  {
    day: 1,
    date: '24/10/2024',
    count: 4,
    title:
      'Sân bay Đà Nẵng · Bán đảo Sơn Trà · Chùa Linh Ứng',
    subtitle:
      'Khám phá thiên nhiên và check-in biểu tượng',
    icon: 'palm-tree',
    image: IMAGES.linhUng,
  },
  {
    day: 2,
    date: '25/10/2024',
    count: 5,
    title:
      'Bà Nà Hills · Cầu Vàng · Làng Pháp',
    subtitle:
      'Trải nghiệm điểm đến nổi tiếng nhất Đà Nẵng',
    icon: 'image-filter-hdr',
    image: IMAGES.goldenBridge,
  },
  {
    day: 3,
    date: '26/10/2024',
    count: 3,
    title:
      'Biển Mỹ Khê · Chợ Hàn · Mua sắm đặc sản',
    subtitle:
      'Thư giãn, ẩm thực và mua sắm',
    icon: 'waves',
    image: IMAGES.myKhe,
  },
];

// ==================== SUMMARY STAT ====================

function SummaryStat({
                       icon,
                       label,
                       value,
                       caption,
                       isLast = false,
                     }: {
  icon: IconName;
  label: string;
  value: string;
  caption: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        paddingHorizontal: 9,
        paddingVertical: 12,
        borderRightWidth: isLast ? 0 : 1,
        borderRightColor: '#E7EAF7',
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 13,
          backgroundColor: '#F0F1FC',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 7,
        }}
      >
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={C.dark}
        />
      </View>

      <Text
        numberOfLines={2}
        style={{
          fontSize: 10,
          fontWeight: '500',
          color: C.muted,
          minHeight: 25,
        }}
      >
        {label}
      </Text>

      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        minimumFontScale={0.7}
        style={{
          color: C.title,
          fontSize: 15,
          fontWeight: '800',
          marginTop: 2,
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          fontSize: 10,
          color: C.muted,
          marginTop: 4,
        }}
        numberOfLines={2}
      >
        {caption}
      </Text>
    </View>
  );
}

// ==================== OVERVIEW ROW ====================

function OverviewRow({
                       icon,
                       label,
                       value,
                       last = false,
                     }: {
  icon: IconName;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 49,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: '#E5E8F5',
      }}
    >
      <MaterialCommunityIcons
        name={icon}
        size={19}
        color={C.dark}
      />

      <Text
        style={{
          width: 104,
          marginLeft: 11,
          fontSize: 11.5,
          fontWeight: '600',
          color: C.title,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          flex: 1,
          fontSize: 11.5,
          color: '#354563',
          lineHeight: 17,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// ==================== DAY CARD ====================

function DayCard({
                   item,
                   onPress,
                 }: {
  item: ItineraryDay;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Xem chi tiết ngày ${item.day}`}
      style={{
        backgroundColor: C.white,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 16,
        padding: 10,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* IMAGE */}

      <Image
        source={{ uri: item.image }}
        resizeMode="cover"
        style={{
          width: 83,
          height: 101,
          borderRadius: 12,
          backgroundColor: '#D8EDE7',
        }}
      />

      {/* TEXT CONTENT */}

      <View
        style={{
          flex: 1,
          minWidth: 0,
          paddingLeft: 11,
        }}
      >
        {/* FIRST ROW */}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          <View
            style={{
              backgroundColor: '#D7F7EF',
              paddingHorizontal: 11,
              paddingVertical: 5,
              borderRadius: 18,
            }}
          >
            <Text
              style={{
                color: C.dark,
                fontSize: 12,
                fontWeight: '800',
              }}
            >
              Ngày {item.day}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 10,
              fontWeight: '600',
              color: C.muted,
            }}
          >
            {item.date}
          </Text>
        </View>

        {/* COUNT */}

        <Text
          style={{
            color: C.primary,
            fontSize: 10,
            fontWeight: '700',
            marginTop: 7,
          }}
        >
          {item.count} địa điểm
        </Text>

        {/* TITLE */}

        <Text
          numberOfLines={2}
          style={{
            color: C.title,
            fontSize: 12,
            fontWeight: '800',
            lineHeight: 17,
            marginTop: 4,
          }}
        >
          {item.title}
        </Text>

        {/* SUBTITLE */}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginTop: 6,
          }}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={15}
            color={C.primary}
          />

          <Text
            numberOfLines={2}
            style={{
              flex: 1,
              marginLeft: 5,
              color: C.muted,
              fontSize: 10.5,
              lineHeight: 15,
            }}
          >
            {item.subtitle}
          </Text>
        </View>
      </View>

      {/* ARROW */}

      <View
        style={{
          width: 29,
          height: 29,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F1F2FC',
          marginLeft: 4,
        }}
      >
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color="#315B78"
        />
      </View>
    </Pressable>
  );
}

// ==================== HIGHLIGHT CHIP ====================

function HighlightChip({
                         icon,
                         label,
                         background,
                         color,
                       }: {
  icon: IconName;
  label: string;
  background: string;
  color: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: background,
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 9,
        marginRight: 7,
        marginBottom: 7,
      }}
    >
      <MaterialCommunityIcons
        name={icon}
        size={17}
        color={color}
      />

      <Text
        style={{
          marginLeft: 6,
          fontSize: 11,
          fontWeight: '600',
          color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ==================== MAIN SCREEN ====================

export default function ItineraryOverviewScreen({
                                                  onBack,
                                                  onViewMap,
                                                }: ItineraryOverviewScreenProps) {
  const [favorite, setFavorite] = useState(false);
  const [detailDay, setDetailDay] = useState<number | null>(null);

  // ==================== HANDLERS ====================


  const handleViewDetail = (day?: number) => {
    // Nhấn vào ngày cụ thể: mở đúng ngày đó.
    // Nhấn nút dưới cùng: mặc định mở Ngày 1.
    setDetailDay(day ?? 1);
  };


  const handleViewMap = () => {
    if (onViewMap) {
      onViewMap();
      return;
    }

    Alert.alert(
      'Bản đồ hành trình',
      'Chức năng xem bản đồ sẽ được tích hợp sau.'
    );
  };

  const handleMore = () => {
    Alert.alert(
      'Tùy chọn lịch trình',
      'Các chức năng chỉnh sửa và chia sẻ đang được phát triển.'
    );
  };

  // ==================== RENDER ====================

// ==================== DETAIL SCREEN ====================

// Mở màn Chi tiết lịch trình khi người dùng nhấn nút
  if (detailDay !== null) {
    return (
      <ItineraryDetailScreen
        initialDay={detailDay}
        totalDays={DAYS.length}
        tripTitle={TRIP.name}
        startDate={TRIP.startDate}
        endDate={TRIP.endDate}
        budget={TRIP.budget}
        onBack={() => {
          setDetailDay(null);
        }}
      />
    );
  }

// ==================== RENDER ====================

  return (
    <SafeAreaView

      edges={['top', 'bottom']}
      style={{
        flex: 1,
        backgroundColor: C.background,
      }}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={C.background}
      />

      {/* ==================== HEADER ==================== */}

      <View
        style={{
          height: 62,
          backgroundColor: '#F5F5FF',
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* BACK */}

        <Pressable
          onPress={onBack}
          accessibilityLabel="Quay lại"
          style={{
            width: 38,
            height: 38,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={29}
            color={C.title}
          />
        </Pressable>

        {/* TITLE */}

        <Text
          style={{
            fontSize: 19,
            fontWeight: '800',
            color: C.title,
          }}
        >
          Lịch trình của bạn
        </Text>

        {/* ACTIONS */}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Pressable
            onPress={() =>
              setFavorite(previous => !previous)
            }
            accessibilityLabel={
              favorite
                ? 'Bỏ yêu thích'
                : 'Thêm vào yêu thích'
            }
            style={{
              width: 35,
              height: 38,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons
              name={
                favorite
                  ? 'heart'
                  : 'heart-outline'
              }
              size={24}
              color={
                favorite
                  ? '#E44A64'
                  : '#4B5979'
              }
            />
          </Pressable>

          <Pressable
            onPress={handleMore}
            accessibilityLabel="Tùy chọn"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: C.white,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons
              name="dots-vertical"
              size={22}
              color={C.title}
            />
          </Pressable>
        </View>
      </View>

      {/* ==================== SCROLL CONTENT ==================== */}

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: 7,
          paddingBottom: 24,
        }}
      >
        {/* ==================== HERO BANNER ==================== */}

        <View
          style={{
            height: 214,
            borderRadius: 20,
            overflow: 'hidden',
            backgroundColor: '#B0D7DC',
          }}
        >
          <ImageBackground
            source={{
              uri: IMAGES.goldenBridge,
            }}
            resizeMode="cover"
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={[
                'rgba(0,40,70,0.08)',
                'rgba(0,44,63,0.35)',
                'rgba(0,33,48,0.88)',
              ]}
              style={{
                flex: 1,
                justifyContent: 'flex-end',
                padding: 16,
              }}
            >
              {/* CREATED BADGE */}

              <View
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#CBFAED',
                  borderRadius: 24,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  marginBottom: 9,
                }}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={17}
                  color={C.dark}
                />

                <Text
                  style={{
                    color: C.dark,
                    fontWeight: '800',
                    fontSize: 11,
                    marginLeft: 5,
                  }}
                >
                  Đã tạo
                </Text>
              </View>

              {/* TRIP NAME */}

              <Text
                style={{
                  color: C.white,
                  fontSize: 23,
                  fontWeight: '800',
                }}
                numberOfLines={2}
              >
                {TRIP.name}
              </Text>

              {/* DATE */}

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 9,
                }}
              >
                <MaterialCommunityIcons
                  name="calendar-month-outline"
                  size={18}
                  color="white"
                />

                <Text
                  style={{
                    color: 'white',
                    fontSize: 13,
                    fontWeight: '600',
                    marginLeft: 7,
                  }}
                >
                  {TRIP.startDate} - {TRIP.endDate}
                </Text>
              </View>

              {/* DURATION */}

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 7,
                }}
              >
                <MaterialCommunityIcons
                  name="weather-sunny"
                  size={18}
                  color="white"
                />

                <Text
                  style={{
                    color: 'white',
                    fontSize: 13,
                    fontWeight: '600',
                    marginLeft: 7,
                  }}
                >
                  {TRIP.duration}
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* ==================== 3 STATS ==================== */}

        <View
          style={{
            backgroundColor: C.white,
            borderRadius: 18,
            marginTop: 12,
            flexDirection: 'row',
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#EEF0FC',
          }}
        >
          <SummaryStat
            icon="map-marker-outline"
            label="Tổng địa điểm"
            value={String(TRIP.totalPlaces)}
            caption="địa điểm"
          />

          <SummaryStat
            icon="cash-multiple"
            label="Dự kiến chi phí"
            value={TRIP.budget}
            caption={`/ ${TRIP.travelerCount} người`}
          />

          <SummaryStat
            icon="car-outline"
            label="Tổng di chuyển"
            value={TRIP.distance}
            caption="trong 3 ngày"
            isLast
          />
        </View>

        {/* ==================== OVERVIEW ==================== */}

        <View
          style={{
            backgroundColor: C.white,
            borderRadius: 20,
            padding: 14,
            marginTop: 13,
          }}
        >
          {/* TITLE */}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <MaterialCommunityIcons
              name="file-document-outline"
              size={24}
              color={C.dark}
            />

            <Text
              style={{
                color: C.title,
                fontSize: 17,
                fontWeight: '800',
                marginLeft: 9,
              }}
            >
              Tổng quan chuyến đi
            </Text>
          </View>

          {/* DETAILS */}

          <View
            style={{
              backgroundColor: '#F4F5FD',
              borderRadius: 15,
              overflow: 'hidden',
            }}
          >
            <OverviewRow
              icon="map-marker-outline"
              label="Điểm bắt đầu"
              value={TRIP.startPoint}
            />

            <OverviewRow
              icon="flag-outline"
              label="Điểm kết thúc"
              value={TRIP.endPoint}
            />

            <OverviewRow
              icon="sign-direction"
              label="Phong cách du lịch"
              value={TRIP.style}
            />

            <OverviewRow
              icon="account-group-outline"
              label="Phù hợp cho"
              value={TRIP.audience}
              last
            />
          </View>
        </View>

        {/* ==================== DAILY ITINERARY ==================== */}

        <View
          style={{
            backgroundColor: C.white,
            borderRadius: 20,
            padding: 13,
            marginTop: 13,
          }}
        >
          {/* SECTION HEADING */}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 13,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={24}
                color={C.dark}
              />

              <Text
                style={{
                  color: C.title,
                  fontSize: 17,
                  fontWeight: '800',
                  marginLeft: 7,
                }}
              >
                Lịch trình theo ngày
              </Text>
            </View>

            <Pressable
              onPress={handleViewMap}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons
                name="map-outline"
                size={19}
                color={C.dark}
              />

              <Text
                style={{
                  color: C.dark,
                  fontSize: 11,
                  fontWeight: '700',
                  marginLeft: 3,
                }}
              >
                Xem bản đồ
              </Text>

              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={C.dark}
              />
            </Pressable>
          </View>

          {/* DAY CARDS */}

          {DAYS.map(day => (
            <DayCard
              key={day.day}
              item={day}
              onPress={() =>
                handleViewDetail(day.day)
              }
            />
          ))}
        </View>

        {/* ==================== TRIP HIGHLIGHTS ==================== */}

        <View
          style={{
            backgroundColor: C.white,
            borderRadius: 20,
            padding: 14,
            marginTop: 13,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 13,
            }}
          >
            <MaterialCommunityIcons
              name="star-four-points"
              size={23}
              color={C.dark}
            />

            <Text
              style={{
                color: C.title,
                fontSize: 17,
                fontWeight: '800',
                marginLeft: 8,
              }}
            >
              Điểm nổi bật của chuyến đi
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            <HighlightChip
              icon="beach"
              label="Biển đẹp"
              background="#E2F8F6"
              color="#075B68"
            />

            <HighlightChip
              icon="food-fork-drink"
              label="Ẩm thực đặc sắc"
              background="#FFF2E3"
              color="#8C5A17"
            />

            <HighlightChip
              icon="camera-outline"
              label="Check-in nổi tiếng"
              background="#FFE9F0"
              color="#A84464"
            />

            <HighlightChip
              icon="bank-outline"
              label="Văn hóa - Tâm linh"
              background="#EEE9FE"
              color="#6F52B0"
            />
          </View>
        </View>
      </ScrollView>

      {/* ==================== FIXED FOOTER ==================== */}

      <View
        style={{
          backgroundColor: C.background,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: '#ECEEFA',
        }}
      >
        <Pressable
          onPress={() => handleViewDetail()}
          accessibilityRole="button"
          style={{
            height: 53,
            backgroundColor: C.dark,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: C.white,
              fontSize: 15,
              fontWeight: '800',
            }}
          >
            Xem chi tiết lịch trình
          </Text>

          <MaterialCommunityIcons
            name="arrow-right"
            size={22}
            color={C.white}
            style={{ marginLeft: 12 }}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
