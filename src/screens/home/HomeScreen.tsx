import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adApi, type FeaturedPlace } from '../../api/adApi';
import { ClientApiError } from '../../api/http';
import { placesApi } from '../../api/placesApi';
import { referenceApi } from '../../api/referenceApi';
import { tripFlowApi, type TravelPlanResponse } from '../../api/tripFlowApi';
import type { PlaceSummary } from '../../api/types';
import { useAuth } from '../../auth/AuthProvider';
import PlaceSearch from '../../components/PlaceSearch';
import SiteAnnouncementBanner from '../../components/SiteAnnouncementBanner';
import { useNotifications } from '../../auth/NotificationsProvider';
import { useRootNav } from '../../navigation/hooks';
import { colors, shadow } from '../../theme';
import { Cover } from '../../ui/Bits';
import { Icon, type IconName } from '../../ui/Icon';
import {
  FadeInView,
  ScalePressable,
  ShimmerBox,
  ShineSweep,
  SlideProgressBar,
} from '../../ui/Motion';
import { SectionTitle } from '../../ui/Screen';
import { dayDiff, formatDate, todayIso } from '../../utils/format';
import { takePendingOnboarding } from '../auth/onboardingFlag';

const ROTATE_MS = 3000;

/** Chuyến đi gần nhất còn chưa kết thúc: đang diễn ra trước, sau đó tới ngày đi sớm nhất */
const pickUpcoming = (plans: TravelPlanResponse[]) => {
  const today = todayIso();
  return (
    plans
      .filter(
        (plan) =>
          (plan.status === 'IN_PROGRESS' || plan.status === 'PLANNED' || plan.status === 'DRAFT') &&
          plan.endDate >= today,
      )
      .sort((a, b) => {
        if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1;
        if (b.status === 'IN_PROGRESS' && a.status !== 'IN_PROGRESS') return 1;
        return a.startDate.localeCompare(b.startDate);
      })[0] ?? null
  );
};

const STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'tune',
    title: 'Cho chúng tôi biết bạn thích gì',
    text: 'Chọn điểm đến, ngân sách, người đi cùng và kiểu trải nghiệm bạn mong muốn.',
  },
  {
    icon: 'auto-awesome',
    title: 'AI gợi ý kèm % phù hợp',
    text: 'Mỗi địa điểm có độ phù hợp và lý do được gợi ý, bạn tự do thêm hay bỏ.',
  },
  {
    icon: 'route',
    title: 'Lịch trình tự chia theo ngày',
    text: 'Hệ thống sắp xếp thứ tự, giờ giấc và cảnh báo nếu một ngày quá dày.',
  },
];

/** Quảng cáo đối tác ở đầu Trang chủ: tự chuyển, dừng/chạy được (giống FeaturedPlaces của web) */
function FeaturedHero({ places }: { places: FeaturedPlace[] }) {
  const navigation = useRootNav();
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    if (places.length < 2 || stopped) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % places.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [places.length, stopped]);

  if (places.length === 0) return null;
  const current = places[Math.min(index, places.length - 1)];
  const go = (next: number) => setIndex((next + places.length) % places.length);

  return (
    <View
      style={[
        { height: 360, borderRadius: 22, overflow: 'hidden', backgroundColor: '#0B2230' },
        shadow.raised,
      ]}
    >
      {current.coverUrl ? (
        <Image
          source={{ uri: current.coverUrl }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
      ) : null}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(3,22,30,0.45)' }]} />

      {/* Hàng trên: chỉ có huy hiệu quảng cáo */}
      <View className="flex-row flex-wrap items-center gap-2 p-4">
        <View className="flex-row items-center gap-1 rounded-full bg-[#FFC94D] px-2.5 py-1">
          <Icon name="campaign" size={14} color="#4A3300" />
          <Text className="text-[10.5px] font-extrabold text-[#4A3300]">Được tài trợ</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-full bg-white px-2.5 py-1">
          <Icon name="verified" size={14} color={colors.verified} />
          <Text className="text-[10.5px] font-bold text-[#1F5FBF]">Đối tác đã xác minh</Text>
        </View>
      </View>

      <View className="absolute bottom-0 left-0 right-0">
        <View className="p-4">
          <FadeInView key={current.id} offset={6} duration={260}>
            <Text numberOfLines={1} className="text-[12px] font-semibold text-white/85">
              {[current.category, current.province].filter(Boolean).join(' · ') ||
                'Địa điểm du lịch'}
            </Text>
            <Text
              numberOfLines={2}
              className="mt-1 text-[24px] font-extrabold leading-[32px] text-white"
            >
              {current.name}
            </Text>
          </FadeInView>
          <View className="mt-3 flex-row flex-wrap items-center gap-2.5">
            <View className="flex-row items-center gap-1 rounded-full bg-white/20 px-3 py-1.5">
              <Icon name="star" size={15} color="#FFC94D" />
              <Text className="text-[12px] font-bold text-white">
                {current.rating !== null
                  ? `${current.rating} (${current.reviewCount} đánh giá)`
                  : 'Mới trên SmartTravel'}
              </Text>
            </View>
            <ScalePressable
              scaleTo={0.95}
              onPress={() => navigation.navigate('PlaceDetail', { placeId: current.id })}
              className="flex-row items-center gap-1 rounded-full bg-white px-4 py-2"
            >
              <Text className="text-[12.5px] font-extrabold text-[#0E7490]">Khám phá ngay</Text>
              <Icon name="arrow-forward" size={16} color={colors.primaryStrong} />
            </ScalePressable>
          </View>
          {places.length > 1 ? (
            /* Hàng dưới: chấm chuyển slide + nút dừng/trước/sau */
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row gap-1.5">
                {places.map((place, i) => (
                  <Pressable
                    key={place.id}
                    onPress={() => go(i)}
                    accessibilityLabel={place.name}
                    hitSlop={8}
                    style={{
                      height: 6,
                      width: i === index ? 24 : 8,
                      borderRadius: 3,
                      backgroundColor: i === index ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                    }}
                  />
                ))}
              </View>
              <View className="flex-row gap-1.5">
                {[
                  {
                    icon: stopped ? 'play-arrow' : 'pause',
                    label: stopped ? 'Tiếp tục tự chuyển' : 'Dừng tự chuyển',
                    onPress: () => setStopped((v) => !v),
                  },
                  { icon: 'chevron-left', label: 'Đối tác trước', onPress: () => go(index - 1) },
                  {
                    icon: 'chevron-right',
                    label: 'Đối tác tiếp theo',
                    onPress: () => go(index + 1),
                  },
                ].map((button) => (
                  <Pressable
                    key={button.label}
                    onPress={button.onPress}
                    accessibilityLabel={button.label}
                    className="h-8 w-8 items-center justify-center rounded-full bg-black/40"
                  >
                    <Icon name={button.icon as IconName} size={19} color="#FFFFFF" />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>
        {places.length > 1 ? (
          <SlideProgressBar durationMs={ROTATE_MS} activeKey={index} paused={stopped} />
        ) : null}
      </View>
    </View>
  );
}

function UpcomingTrip() {
  const { user } = useAuth();
  const navigation = useRootNav();
  const [plan, setPlan] = useState<TravelPlanResponse | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [opening, setOpening] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;
      tripFlowApi
        .plans()
        .then((plans) => active && setPlan(pickUpcoming(plans)))
        .catch(() => undefined)
        .finally(() => active && setLoaded(true));
      return () => {
        active = false;
      };
    }, [user]),
  );

  const open = async (target: TravelPlanResponse) => {
    setOpening(true);
    try {
      await tripFlowApi.activeItinerary(target.planId);
      navigation.navigate('Itinerary', { planId: target.planId });
    } catch (caught) {
      // Chưa có lịch trình: về bước chọn địa điểm của kế hoạch
      if (caught instanceof ClientApiError && caught.status === 404) {
        navigation.navigate('SelectedPlaces', { planId: target.planId });
      } else {
        navigation.navigate('Tabs', { screen: 'Trips' });
      }
    } finally {
      setOpening(false);
    }
  };

  if (!user || (loaded && !plan)) {
    return (
      <View style={shadow.card} className="rounded-3xl bg-white p-5">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#CFFAFE]">
          <Icon name="luggage" size={26} color={colors.primary} />
        </View>
        <Text className="mt-4 text-[17px] font-extrabold text-[#0F2A3B]">
          {user ? 'Chưa có chuyến đi nào sắp tới' : 'Lưu và theo dõi chuyến đi của bạn'}
        </Text>
        <Text className="mt-1 text-[12.5px] leading-5 text-[#557080]">
          {user
            ? 'Tạo một kế hoạch mới, SmartTravel sẽ gợi ý địa điểm và chia lịch trình giúp bạn.'
            : 'Đăng nhập để tạo kế hoạch, nhận gợi ý cá nhân hóa và xem lịch trình theo ngày.'}
        </Text>
        <Pressable
          onPress={() => (user ? navigation.navigate('PlanTrip') : navigation.navigate('Login'))}
          className="mt-4 flex-row items-center gap-1.5 self-start rounded-full bg-[#0891B2] px-5 py-2.5"
        >
          <Text className="text-[12.5px] font-bold text-white">
            {user ? 'Tạo chuyến đi' : 'Đăng nhập'}
          </Text>
          <Icon name="arrow-forward" size={17} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={shadow.card} className="rounded-3xl bg-white p-5">
        <View className="h-5 w-40 rounded-full bg-[#F3FBFC]" />
        <View className="mt-4 h-8 w-2/3 rounded-full bg-[#F3FBFC]" />
        <View className="mt-3 h-4 w-1/2 rounded-full bg-[#F3FBFC]" />
      </View>
    );
  }

  const today = todayIso();
  const totalDays = dayDiff(plan.startDate, plan.endDate) + 1;
  const untilStart = dayDiff(today, plan.startDate);
  const ongoing = untilStart <= 0;
  const dayNumber = Math.min(totalDays, dayDiff(plan.startDate, today) + 1);

  return (
    <View className="overflow-hidden rounded-3xl bg-[#EDF7F9] p-5">
      <View className="flex-row items-center gap-1.5">
        <Icon name="event" size={16} color={colors.primary} />
        <Text className="text-[10.5px] font-extrabold uppercase tracking-[1.6px] text-[#0891B2]">
          {ongoing ? 'Đang diễn ra' : 'Chuyến đi sắp tới'}
        </Text>
      </View>
      <Text numberOfLines={1} className="mt-2 text-[23px] font-extrabold text-[#0F2A3B]">
        {plan.destination}
      </Text>
      <Text numberOfLines={1} className="text-[12px] text-[#557080]">
        {plan.title}
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        <View className="flex-row items-center gap-1 rounded-full bg-white px-3 py-1.5">
          <Icon name="calendar-month" size={15} color={colors.primary} />
          <Text className="text-[12px] font-semibold text-[#0F2A3B]">
            {formatDate(plan.startDate)} – {formatDate(plan.endDate)}
          </Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-full bg-white px-3 py-1.5">
          <Icon name="group" size={15} color={colors.primary} />
          <Text className="text-[12px] font-semibold text-[#0F2A3B]">{plan.groupSize} người</Text>
        </View>
      </View>
      <View className="mt-4 flex-row items-end justify-between">
        {ongoing ? (
          <Text className="text-[#0F2A3B]">
            <Text className="text-[28px] font-extrabold">Ngày {dayNumber}</Text>
            <Text className="text-[13px] text-[#557080]"> / {totalDays}</Text>
          </Text>
        ) : (
          <Text className="text-[#0F2A3B]">
            <Text className="text-[13px] text-[#557080]">Còn </Text>
            <Text className="text-[28px] font-extrabold">{untilStart}</Text>
            <Text className="text-[13px] text-[#557080]"> ngày nữa</Text>
          </Text>
        )}
        <ScalePressable
          scaleTo={0.94}
          disabled={opening}
          onPress={() => void open(plan)}
          className="flex-row items-center gap-1.5 rounded-full bg-[#0891B2] px-4 py-2.5"
        >
          <Text className="text-[12.5px] font-bold text-white">
            {opening ? 'Đang mở…' : 'Xem chuyến đi'}
          </Text>
          <Icon name="arrow-forward" size={17} color="#FFFFFF" />
        </ScalePressable>
      </View>
    </View>
  );
}

/** Trang chủ du khách — giống HomePage của web */
export default function HomeScreen() {
  const { user } = useAuth();
  const { unread } = useNotifications();
  const navigation = useRootNav();
  const [featured, setFeatured] = useState<FeaturedPlace[]>([]);
  const [recent, setRecent] = useState<PlaceSummary[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [placeTotal, setPlaceTotal] = useState<number | null>(null);
  const [provinceCount, setProvinceCount] = useState<number | null>(null);
  const bellShake = useRef(new Animated.Value(0)).current;
  const badgePop = useRef(new Animated.Value(1)).current;
  const prevUnreadRef = useRef(unread);

  // Chuông rung lắc + chấm đỏ nảy mỗi khi có thông báo mới đổ về realtime
  useEffect(() => {
    if (unread > prevUnreadRef.current) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(bellShake, { toValue: 1, duration: 75, useNativeDriver: true }),
          Animated.timing(bellShake, { toValue: -1, duration: 90, useNativeDriver: true }),
          Animated.timing(bellShake, { toValue: 0.7, duration: 80, useNativeDriver: true }),
          Animated.timing(bellShake, { toValue: -0.7, duration: 80, useNativeDriver: true }),
          Animated.timing(bellShake, { toValue: 0, duration: 75, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(badgePop, { toValue: 1.38, duration: 130, useNativeDriver: true }),
          Animated.spring(badgePop, {
            toValue: 1,
            useNativeDriver: true,
            speed: 24,
            bounciness: 10,
          }),
        ]),
      ]).start();
    }
    prevUnreadRef.current = unread;
  }, [unread, bellShake, badgePop]);

  const bellRotate = bellShake.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-16deg', '16deg'],
  });

  // Lần đăng nhập đầu tiên sau khi đăng ký → trả lời câu hỏi sở thích trước
  useEffect(() => {
    if (user && takePendingOnboarding()) {
      navigation.navigate('Preferences', {
        notice: 'Chào mừng bạn! Trả lời vài câu hỏi để SmartTravel gợi ý đúng gu bạn.',
      });
    }
  }, [user, navigation]);

  useEffect(() => {
    let active = true;
    adApi
      .featured(8)
      .then((items) => active && setFeatured(items))
      .catch(() => undefined);
    // Mặc định API sắp theo ngày cập nhật mới nhất
    placesApi
      .list({ page: 0, size: 12 })
      .then((result) => {
        if (!active) return;
        setRecent(result.items);
        setPlaceTotal(result.total);
      })
      .catch(() => undefined)
      .finally(() => active && setLoadingRecent(false));
    referenceApi
      .provinces()
      .then((items) => active && setProvinceCount(items.length))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const stats = [
    placeTotal !== null
      ? { icon: 'place' as IconName, value: `${placeTotal}+`, label: 'địa điểm' }
      : null,
    provinceCount !== null
      ? { icon: 'map' as IconName, value: String(provinceCount), label: 'tỉnh thành' }
      : null,
    { icon: 'auto-awesome' as IconName, value: 'AI', label: 'gợi ý' },
  ].filter((item): item is { icon: IconName; value: string; label: string } => item !== null);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <SiteAnnouncementBanner />

        {/* HERO giống web: lời chào, tìm kiếm, lập kế hoạch + quảng cáo đối tác trong cùng khung xanh */}
        <View className="overflow-hidden rounded-[28px] bg-[#0891B2] p-5">
          <View className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <View className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-[#2FBAC9]/20" />
          <View className="flex-row items-center justify-between gap-3">
            <Text
              numberOfLines={1}
              className="flex-shrink rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white"
            >
              Xin chào, {user?.name ?? 'bạn'} 👋
            </Text>
            <ScalePressable
              scaleTo={0.9}
              onPress={() =>
                user
                  ? navigation.navigate('Notifications')
                  : navigation.navigate('Login', { notice: 'Đăng nhập để nhận thông báo' })
              }
              accessibilityLabel={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/15"
            >
              <Animated.View style={{ transform: [{ rotate: bellRotate }] }}>
                <Icon name="notifications" size={21} color="#FFFFFF" />
              </Animated.View>
              {unread > 0 ? (
                <Animated.View
                  style={{ transform: [{ scale: badgePop }] }}
                  className="absolute -right-0.5 -top-0.5 min-w-[18px] items-center rounded-full bg-[#E5484D] px-1"
                >
                  <Text className="text-[10px] font-extrabold text-white">
                    {unread > 99 ? '99+' : unread}
                  </Text>
                </Animated.View>
              ) : null}
            </ScalePressable>
          </View>
          <Text className="mt-3 text-[27px] font-extrabold leading-[33px] text-white">
            Việt Nam theo cách{'\n'}
            <Text className="text-[#97EBF4]">của riêng bạn</Text>
          </Text>
          <Text className="mt-2 text-[13px] leading-5 text-white/85">
            Tìm địa điểm, nhận gợi ý cá nhân hóa và để SmartTravel sắp xếp lịch trình theo sở thích,
            ngân sách của bạn.
          </Text>
          <PlaceSearch />
          <View className="mt-4 flex-row flex-wrap gap-2.5">
            <ScalePressable
              scaleTo={0.95}
              onPress={() =>
                user ? navigation.navigate('PlanTrip') : navigation.navigate('Login')
              }
              className="flex-row items-center gap-1.5 overflow-hidden rounded-full bg-white px-4 py-2.5"
            >
              <ShineSweep />
              <Icon name="auto-awesome" size={17} color={colors.primaryStrong} />
              <Text className="text-[13px] font-extrabold text-[#0E7490]">Lập kế hoạch với AI</Text>
            </ScalePressable>
            <ScalePressable
              scaleTo={0.95}
              onPress={() => navigation.navigate('Tabs', { screen: 'Explore' })}
              className="flex-row items-center gap-1.5 rounded-full border border-white/40 px-4 py-2.5"
            >
              <Text className="text-[13px] font-bold text-white">Khám phá</Text>
              <Icon name="arrow-forward" size={17} color="#FFFFFF" />
            </ScalePressable>
          </View>
          <View className="mt-5 flex-row flex-wrap gap-x-5 gap-y-2">
            {stats.map((stat) => (
              <View key={stat.label} className="flex-row items-center gap-1.5">
                <Icon name={stat.icon} size={18} color="#97EBF4" />
                <Text className="text-[17px] font-extrabold text-white">{stat.value}</Text>
                <Text className="text-[11.5px] text-white/80">{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Quảng cáo đối tác tự chuyển (không có quảng cáo thì ẩn) */}
          {featured.length > 0 ? (
            <View className="mt-5">
              <FeaturedHero places={featured} />
            </View>
          ) : null}
        </View>

        {/* Chuyến đi sắp tới + sở thích */}
        <View className="mt-7 gap-4">
          <UpcomingTrip />
          <View className="overflow-hidden rounded-3xl bg-[#FFF6E0] p-5">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white">
              <Icon name="person-pin-circle" size={26} color={colors.gold} />
            </View>
            <Text className="mt-4 text-[17px] font-extrabold text-[#0F2A3B]">
              Hoàn thiện sở thích du lịch
            </Text>
            <Text className="mt-1 text-[12.5px] leading-5 text-[#6B5A35]">
              Càng hiểu bạn, gợi ý càng sát: chế độ ăn, người đi cùng, nhu cầu đặc biệt…
            </Text>
            <ScalePressable
              scaleTo={0.95}
              onPress={() =>
                user ? navigation.navigate('Preferences') : navigation.navigate('Login')
              }
              className="mt-4 flex-row items-center gap-1.5 self-start rounded-full bg-[#0F2A3B] px-5 py-2.5"
            >
              <Text className="text-[12.5px] font-bold text-white">Thiết lập sở thích</Text>
              <Icon name="arrow-forward" size={17} color="#FFFFFF" />
            </ScalePressable>
          </View>
        </View>

        {/* Mới có trên SmartTravel */}
        {loadingRecent || recent.length > 0 ? (
          <View className="mt-8">
            <SectionTitle
              eyebrow="Vừa cập nhật"
              title="Mới có trên SmartTravel"
              action={
                <ScalePressable
                  scaleTo={0.93}
                  onPress={() => navigation.navigate('Tabs', { screen: 'Explore' })}
                  hitSlop={8}
                >
                  <Text className="text-[13px] font-bold text-[#0891B2]">Xem tất cả</Text>
                </ScalePressable>
              }
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 4 }}
            >
              {loadingRecent
                ? Array.from({ length: 3 }, (_, i) => (
                    <View key={i} className="w-[220px] overflow-hidden rounded-[20px] bg-white">
                      <ShimmerBox height={140} borderRadius={0} />
                      <View className="gap-2 p-3">
                        <ShimmerBox width="75%" height={14} borderRadius={7} />
                        <ShimmerBox width="50%" height={12} borderRadius={6} />
                      </View>
                    </View>
                  ))
                : recent.map((place) => (
                    <ScalePressable
                      scaleTo={0.97}
                      key={place.id}
                      onPress={() => navigation.navigate('PlaceDetail', { placeId: place.id })}
                      style={shadow.card}
                      className="w-[220px] overflow-hidden rounded-[20px] bg-white"
                    >
                      <Cover uri={place.coverUrl} height={140} />
                      <View className="p-3">
                        <Text numberOfLines={1} className="text-[13.5px] font-bold text-[#0F2A3B]">
                          {place.name}
                        </Text>
                        <View className="mt-0.5 flex-row items-center gap-1">
                          <Icon name="location-on" size={14} color={colors.muted} />
                          <Text numberOfLines={1} className="flex-1 text-[11.5px] text-[#557080]">
                            {place.province?.name ?? 'Việt Nam'}
                          </Text>
                        </View>
                      </View>
                    </ScalePressable>
                  ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Cách hoạt động */}
        <View style={shadow.card} className="mt-8 rounded-3xl bg-white p-5">
          <Text className="text-[10.5px] font-extrabold uppercase tracking-[1.6px] text-[#0891B2]">
            Cách hoạt động
          </Text>
          <Text className="mt-1 text-[19px] font-extrabold text-[#0F2A3B]">
            Lịch trình hoàn chỉnh chỉ với 3 bước
          </Text>
          <View className="mt-4 gap-3">
            {STEPS.map((step, i) => (
              <View key={step.title} className="flex-row gap-3 rounded-2xl bg-[#F3FBFC] p-4">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#0E7490]">
                  <Icon name={step.icon} size={21} color="#FFFFFF" />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[14px] font-extrabold text-[#0F2A3B]">
                    {i + 1}. {step.title}
                  </Text>
                  <Text className="mt-0.5 text-[12px] leading-5 text-[#557080]">{step.text}</Text>
                </View>
              </View>
            ))}
          </View>
          <Pressable
            onPress={() => (user ? navigation.navigate('PlanTrip') : navigation.navigate('Login'))}
            className="mt-4 flex-row items-center justify-center gap-1.5 rounded-full bg-[#0891B2] py-3"
          >
            <Text className="text-[13px] font-bold text-white">Bắt đầu ngay</Text>
            <Icon name="arrow-forward" size={17} color="#FFFFFF" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
