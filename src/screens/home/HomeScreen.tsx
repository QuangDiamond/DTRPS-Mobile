import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Destination, heroImage } from '../../constants/homeData';
import BottomTabBar, { type AppTab } from '../../components/BottomTabBar';
import AppHeader from '../../components/AppHeader';

// Demo-only UI: dữ liệu đối tác / mức giá / ưu đãi đều là hardcode.
// Không kết nối quảng cáo thật hoặc thanh toán.
const C = {
  primary: '#00685F',
  teal: '#008378',
  background: '#FAF8FF',
  text: '#131B2E',
  muted: '#64716F',
  white: '#FFFFFF',
};

type IconName = React.ComponentProps<typeof Icon>['name'];
type AdCategory = 'Lưu trú' | 'Ẩm thực' | 'Trải nghiệm';

export type PartnerAd = {
  id: string;
  name: string;
  category: AdCategory;
  location: string;
  image: string;
  offer: string;
  headline: string;
  tagline: string;
  description: string;
  rating: string;
  price: string;
  oldPrice?: string;
  voucher?: string;
  badge: string;
};

export type HomeScreenProps = {
  displayName?: string;
  onTabPress?: (tab: AppTab) => void;
  onSearch?: (query: string) => void;
  onFilterPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onPlanTripPress?: () => void;
  onDestinationPress?: (destination: Destination) => void;
  onViewAllPress?: () => void;
  onPartnerPress?: () => void;
  onPartnerAdPress?: (ad: PartnerAd) => void;
  onSetupPreferencesPress?: () => void;
};

// Ảnh demo từ Unsplash: thiết bị cần internet để tải lần đầu.
// Tên thương hiệu và ưu đãi chỉ phục vụ bài demo frontend.
const PARTNER_ADS: PartnerAd[] = [
  {
    id: 'partner-01', name: 'Mây Retreat', category: 'Lưu trú', location: 'Đà Lạt, Lâm Đồng',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1400&q=85',
    offer: 'GIẢM 25%', headline: 'Một kỳ nghỉ\ngiữa thiên nhiên', tagline: 'Thức dậy giữa rừng thông',
    description: 'Không gian xanh, ấm cúng cho chuyến đi thư giãn.',
    rating: '4.9', price: '890.000đ', oldPrice: '1.190.000đ', voucher: 'MAY25', badge: 'Ưu đãi nổi bật',
  },
  {
    id: 'partner-02', name: 'Sóng Xanh Resort', category: 'Lưu trú', location: 'Đà Nẵng',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1400&q=85',
    offer: 'GIẢM 30%', headline: 'Chạm biển,\nchạm bình yên', tagline: 'Kỳ nghỉ bên bờ biển',
    description: 'Hồ bơi xanh mát, không gian thoáng đãng và yên bình.',
    rating: '4.8', price: '1.250.000đ', oldPrice: '1.790.000đ', voucher: 'BIEN30', badge: 'Được quan tâm',
  },
  {
    id: 'partner-03', name: 'Bếp Nhà Hội An', category: 'Ẩm thực', location: 'Hội An, Quảng Nam',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=85',
    offer: 'TẶNG MÓN', headline: 'Trọn vẹn hương vị\nphố Hội', tagline: 'Bữa tối giữa phố cổ',
    description: 'Món ngon địa phương trong không gian thật gần gũi.',
    rating: '4.9', price: '199.000đ', oldPrice: '249.000đ', voucher: 'HOIAN', badge: 'Ẩm thực địa phương',
  },
  {
    id: 'partner-04', name: 'Hải Âu Experience', category: 'Trải nghiệm', location: 'Phú Quốc',
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1400&q=85',
    offer: 'GIẢM 15%', headline: 'Đi tìm những\nchuyến phiêu lưu', tagline: 'Một ngày giữa biển xanh',
    description: 'Trải nghiệm khám phá thiên nhiên cùng người bản địa.',
    rating: '4.8', price: '590.000đ', oldPrice: '690.000đ', voucher: 'HAIAU15', badge: 'Trải nghiệm mới',
  },
  {
    id: 'partner-05', name: 'Mộc Phố Coffee', category: 'Ẩm thực', location: 'Hà Nội',
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=1000&q=85',
    offer: 'MUA 1 TẶNG 1', headline: 'Một chút bình yên\ngiữa phố', tagline: 'Góc nhỏ cho ngày đẹp trời',
    description: 'Cà phê ấm áp và những cuộc hẹn thật chậm.',
    rating: '4.7', price: '49.000đ', voucher: 'CAPHE', badge: 'Được yêu thích',
  },
];



function ActionIcon({ name, onPress, badge = false }: {
  name: IconName; onPress?: () => void; badge?: boolean;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F3FF]">
      <Icon name={name} size={21} color={C.primary} />
      {badge && <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />}
    </Pressable>
  );
}

function PartnerSectionHeading({ eyebrow, title, subtitle, action, onAction }: {
  eyebrow?: string; title: string; subtitle?: string; action?: string; onAction?: () => void;
}) {
  return (
    <View className="mb-3 flex-row items-end justify-between px-4">
      <View className="flex-1 pr-3">
        {eyebrow ? <Text className="mb-1 text-[10px] font-extrabold tracking-[1.8px]" style={{ color: C.teal }}>{eyebrow}</Text> : null}
        <Text className="text-[20px] font-extrabold" style={{ color: C.text }}>{title}</Text>
        {subtitle ? <Text className="mt-1 text-[11px]" style={{ color: C.muted }}>{subtitle}</Text> : null}
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" className="flex-row items-center rounded-full bg-[#E8F5EF] px-3 py-2">
          <Text className="text-[11px] font-bold" style={{ color: C.primary }}>{action}</Text>
          <Icon name="chevron-right" size={16} color={C.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const GAP = 12;
const SLIDE_TIME_MS = 4500;
function PartnerBannerCarousel({ onAdPress }: { onAdPress: (ad: PartnerAd) => void }) {
  const { width } = useWindowDimensions();
  const cardWidth = width - 32;
  const step = cardWidth + GAP;
  const ref = useRef<ScrollView>(null);
  const indexRef = useRef(0);
  const draggingRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = PARTNER_ADS.slice(0, 4);

  const goTo = (index: number, animated = true) => {
    const target = (index + slides.length) % slides.length;
    indexRef.current = target;
    setActiveIndex(target);
    ref.current?.scrollTo({ x: target * step, animated });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (!draggingRef.current) goTo(indexRef.current + 1, indexRef.current + 1 < slides.length);
    }, SLIDE_TIME_MS);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => { ref.current?.scrollTo({ x: indexRef.current * step, animated: false }); }, [step]);

  return (
    <View>
      <ScrollView
        ref={ref}
        horizontal
        nestedScrollEnabled
        decelerationRate="fast"
        snapToInterval={step}
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => { draggingRef.current = true; }}
        onScrollEndDrag={() => { draggingRef.current = false; }}
        onMomentumScrollEnd={event => {
          const i = Math.min(slides.length - 1, Math.max(0, Math.round(event.nativeEvent.contentOffset.x / step)));
          indexRef.current = i;
          setActiveIndex(i);
          draggingRef.current = false;
        }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: GAP, paddingBottom: 8 }}
      >
        {slides.map((ad, index) => (
          <Pressable key={ad.id} onPress={() => onAdPress(ad)} accessibilityRole="button"
                     accessibilityLabel={`Quảng cáo ${ad.name}, ${ad.offer}`}
                     style={{ width: cardWidth, height: 292, borderRadius: 23, overflow: 'hidden', backgroundColor: '#173D36', elevation: 4 }}>
            <ImageBackground source={{ uri: ad.image }} resizeMode="cover" style={{ flex: 1 }}>
              <View style={{ flex: 1, justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.18)' }}>
                <View className="flex-row items-center justify-between p-4">
                  <View className="flex-row items-center rounded-full bg-white/95 px-3 py-2">
                    <Icon name="bullhorn-outline" size={13} color={C.primary} />
                    <Text className="ml-1.5 text-[10px] font-extrabold" style={{ color: C.primary }}>QUẢNG CÁO ĐỐI TÁC</Text>
                  </View>
                  <View className="rounded-full bg-black/50 px-3 py-1.5">
                    <Text className="text-[11px] font-semibold text-white">{index + 1} / {slides.length}</Text>
                  </View>
                </View>
                <View className="mx-3 mb-3 rounded-[20px] px-4 py-4" style={{ backgroundColor: 'rgba(9,39,36,0.92)' }}>
                  <View className="mb-2 flex-row items-center">
                    <Text className="text-[10px] font-bold tracking-widest text-[#A7E9DB]">{ad.category.toUpperCase()}</Text>
                    <View className="mx-2 h-1 w-1 rounded-full bg-[#A7E9DB]" />
                    <Icon name="map-marker-outline" size={13} color="#E1F2EC" />
                    <Text className="ml-0.5 text-[10px] text-[#E1F2EC]" numberOfLines={1}>{ad.location}</Text>
                  </View>
                  <Text className="text-[24px] font-extrabold leading-[29px] text-white" numberOfLines={2}>{ad.headline}</Text>
                  <Text className="mt-1 text-[11px] text-[#D8EFE7]" numberOfLines={1}>{ad.name} · {ad.tagline}</Text>
                  <View className="mt-3 flex-row items-center justify-between">
                    <View className="rounded-full bg-[#F8E4B4] px-3 py-2">
                      <Text className="text-[11px] font-extrabold text-[#795213]">{ad.offer}</Text>
                    </View>
                    <View className="flex-row items-center rounded-full bg-white px-4 py-2.5">
                      <Text className="mr-1 text-[11px] font-extrabold" style={{ color: C.primary }}>Khám phá ngay</Text>
                      <Icon name="arrow-top-right" color={C.primary} size={15} />
                    </View>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </Pressable>
        ))}
      </ScrollView>
      <View className="mt-1 flex-row items-center justify-between px-5">
        <View className="flex-row items-center">
          <Icon name="gesture-swipe-horizontal" size={15} color={C.muted} />
          <Text className="ml-1.5 text-[11px]" style={{ color: C.muted }}>Vuốt để xem thêm</Text>
        </View>
        <View className="flex-row items-center">
          {slides.map((ad, index) => (
            <Pressable key={ad.id} onPress={() => goTo(index)} accessibilityRole="button"
                       accessibilityLabel={`Xem quảng cáo ${index + 1}`} className="h-8 justify-center px-1">
              <View style={{ height: 7, width: index === activeIndex ? 24 : 7, borderRadius: 6,
                backgroundColor: index === activeIndex ? C.primary : '#CDDCD5' }} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function OfferCard({ ad, isSaved, onAdPress, onSave }: {
  ad: PartnerAd; isSaved: boolean; onAdPress: () => void; onSave: () => void;
}) {
  return (
    <View style={{ width: 239, borderRadius: 20, overflow: 'hidden', backgroundColor: C.white, elevation: 2, marginRight: 12 }}>
      <Pressable onPress={onAdPress} accessibilityRole="button" accessibilityLabel={`Xem ưu đãi ${ad.name}`}>
        <View>
          <Image source={{ uri: ad.image }} resizeMode="cover" style={{ width: '100%', height: 141 }} />
          <View className="absolute left-3 top-3 rounded-full bg-[#FFF1CC] px-2.5 py-1.5">
            <Text className="text-[10px] font-extrabold text-[#835500]">{ad.offer}</Text>
          </View>
          <View className="absolute bottom-2 left-3 rounded-full bg-black/65 px-2.5 py-1">
            <Text className="text-[10px] font-semibold text-white">Tài trợ</Text>
          </View>
        </View>
        <View className="px-3 pb-4 pt-3">
          <Text className="text-[10px] font-bold" style={{ color: C.teal }}>{ad.category.toUpperCase()}</Text>
          <Text className="mt-1 text-[15px] font-extrabold" style={{ color: C.text }} numberOfLines={1}>{ad.name}</Text>
          <View className="mt-1 flex-row items-center">
            <Icon name="map-marker-outline" size={13} color={C.muted} />
            <Text className="ml-0.5 flex-1 text-[11px]" style={{ color: C.muted }} numberOfLines={1}>{ad.location}</Text>
            <Icon name="star" size={12} color="#EAA93E" />
            <Text className="ml-1 text-[11px] font-bold" style={{ color: C.text }}>{ad.rating}</Text>
          </View>
          <View className="mt-3 flex-row items-end justify-between">
            <View className="flex-1">
              {ad.oldPrice ? <Text className="text-[10px] line-through" style={{ color: '#A3ACA8' }}>{ad.oldPrice}</Text> : null}
              <Text className="text-[17px] font-extrabold" style={{ color: C.primary }}>{ad.price}</Text>
            </View>
            <View className="rounded-full bg-[#E6F5EF] px-3 py-2">
              <Text className="text-[11px] font-bold" style={{ color: C.primary }}>Xem deal →</Text>
            </View>
          </View>
        </View>
      </Pressable>
      <Pressable onPress={onSave} accessibilityRole="button" accessibilityLabel={isSaved ? 'Bỏ lưu ưu đãi' : 'Lưu ưu đãi'}
                 style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 17,
                   backgroundColor: 'rgba(255,255,255,0.96)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={isSaved ? 'heart' : 'heart-outline'} size={19} color={isSaved ? '#E65C61' : C.primary} />
      </Pressable>
    </View>
  );
}

function PartnerRow({ ad, onPress }: { ad: PartnerAd; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Tìm hiểu đối tác ${ad.name}`}
               className="mb-3 flex-row overflow-hidden rounded-2xl bg-white p-2.5" style={{ elevation: 1 }}>
      <Image source={{ uri: ad.image }} resizeMode="cover" className="h-[92px] w-[98px] rounded-xl" />
      <View className="ml-3 flex-1 justify-between py-1">
        <View>
          <View className="flex-row items-center justify-between">
            <Text className="text-[10px] font-semibold" style={{ color: C.teal }}>{ad.badge}</Text>
            <Text className="text-[10px]" style={{ color: C.muted }}>Quảng cáo</Text>
          </View>
          <Text className="mt-1 text-[14px] font-extrabold" style={{ color: C.text }} numberOfLines={1}>{ad.name}</Text>
          <Text className="mt-1 text-[11px]" style={{ color: C.muted }} numberOfLines={1}>{ad.category} · {ad.location}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Icon name="star" size={12} color="#EAA93E" />
            <Text className="ml-1 text-[11px] font-bold" style={{ color: C.text }}>{ad.rating}</Text>
            <Text className="ml-2 text-[11px] font-semibold" style={{ color: C.primary }}>{ad.offer}</Text>
          </View>
          <Icon name="arrow-top-right" size={17} color={C.primary} />
        </View>
      </View>
    </Pressable>
  );
}

function PartnerShowcase({ onAdPress, onPartnerPress }: {
  onAdPress: (ad: PartnerAd) => void;
  onPartnerPress?: () => void;
}) {
  const [savedAdIds, setSavedAdIds] = useState<string[]>([]);
  const [showAllPartners, setShowAllPartners] = useState(false);

  const toggleSaved = (id: string) => setSavedAdIds(ids => ids.includes(id)
    ? ids.filter(x => x !== id) : [...ids, id]);

  return (
    <View className="mt-7">
      {/* 1. Banner tự chạy - điểm nhấn chính của quảng cáo */}
      <PartnerSectionHeading
        eyebrow="SMARTTRAVEL PARTNERS · TÀI TRỢ"
        title="Đặc quyền từ đối tác"
        subtitle="Ưu đãi dành riêng cho chuyến đi của bạn"
      />
      <PartnerBannerCarousel onAdPress={onAdPress} />

      {/* 2. Các deal tài trợ: có lưu yêu thích */}
      <View className="mt-5">
        <PartnerSectionHeading eyebrow="HOT DEALS" title="Ưu đãi đang nổi bật" subtitle="Chọn ưu đãi phù hợp với ngân sách" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 3 }}>
          {PARTNER_ADS.map(ad => (
            <OfferCard key={ad.id} ad={ad} isSaved={savedAdIds.includes(ad.id)}
                       onAdPress={() => onAdPress(ad)} onSave={() => toggleSaved(ad.id)} />
          ))}
        </ScrollView>
      </View>


      {/* 3. Danh sách đối tác nổi bật, nút xem thêm/thu gọn */}
      <View className="mt-7">
        <PartnerSectionHeading eyebrow="PARTNER SPOTLIGHT" title="Đối tác đáng khám phá"
                               subtitle="Những địa điểm và dịch vụ đang giới thiệu"
                               action={showAllPartners ? 'Thu gọn' : 'Xem tất cả'}
                               onAction={() => setShowAllPartners(v => !v)} />
        <View className="px-4">
          {(showAllPartners ? PARTNER_ADS : PARTNER_ADS.slice(0, 3)).map(ad => (
            <PartnerRow key={ad.id} ad={ad} onPress={() => onAdPress(ad)} />
          ))}
        </View>
      </View>

      {/* 4. CTA dành cho Business Owner */}
      <View className="mx-4 mt-4 rounded-[23px] px-5 py-5" style={{ backgroundColor: C.primary }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[10px] font-extrabold tracking-[1.5px] text-[#B7E7DA]">DÀNH CHO ĐỐI TÁC</Text>
            <Text className="mt-2 text-[19px] font-extrabold leading-[25px] text-white">
              Đưa thương hiệu của bạn đến nhiều du khách hơn
            </Text>
            <Text className="mt-2 text-[11px] leading-[17px] text-[#D6F0E9]">
              Giới thiệu dịch vụ lưu trú, ẩm thực và trải nghiệm ngay trên SmartTravel.
            </Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Icon name="storefront-outline" size={26} color="white" />
          </View>
        </View>
        <Pressable accessibilityRole="button"
                   onPress={() => onPartnerPress ? onPartnerPress() : Alert.alert('Hợp tác cùng SmartTravel',
                     'Màn hình đối tác sẽ được kết nối sau.')}
                   className="mt-4 flex-row items-center justify-center rounded-full bg-white py-3.5">
          <Text className="mr-1.5 text-[12px] font-extrabold" style={{ color: C.primary }}>Trở thành đối tác</Text>
          <Icon name="arrow-right" color={C.primary} size={16} />
        </Pressable>
      </View>
      <Text className="mt-3 px-7 text-center text-[10px] leading-[15px]" style={{ color: '#98A6A1' }}>
        Quảng cáo, giá, lượt đánh giá và ưu đãi trên màn hình này là dữ liệu demo.
      </Text>
    </View>
  );
}

export default function HomeScreen({
                                     displayName = 'Traveller', onTabPress, onSearch, onFilterPress,
                                     onNotificationPress, onProfilePress, onPartnerPress, onPlanTripPress,
                                     onPartnerAdPress, onSetupPreferencesPress,
                                   }: HomeScreenProps) {
  const [query, setQuery] = useState('');
  const [homeCategory, setHomeCategory] = useState('Tất cả');
  const homeCategories: { label: string; icon: IconName }[] = [
    { label: 'Tất cả', icon: 'compass-outline' },
    { label: 'Vịnh biển', icon: 'sail-boat' },
    { label: 'Núi cao', icon: 'image-filter-hdr' },
    { label: 'Di sản', icon: 'temple-buddhist' },
    { label: 'Ẩm thực', icon: 'silverware-fork-knife' },
  ];
  const openAd = (ad: PartnerAd) => {
    if (onPartnerAdPress) { onPartnerAdPress(ad); return; }
    Alert.alert(ad.name, `${ad.category} · ${ad.location}\n${ad.description}\n\n${ad.offer} · Từ ${ad.price}\nMã demo: ${ad.voucher ?? 'Không có'}\n\nĐây là quảng cáo minh họa.`, [{ text: 'Đóng' }]);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: C.background }}>
      {/* Giữ nguyên header / tìm kiếm / banner lập kế hoạch từ Home hiện tại */}
      <AppHeader
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="mx-4 mt-2 flex-row rounded-full bg-[#F2F3FF] p-1">
          <View className="flex-1 flex-row items-center justify-center rounded-full py-2" style={{ backgroundColor: C.primary }}>
            <Icon name="compass-outline" color="white" size={16} />
            <Text className="ml-1 text-[12px] font-bold text-white">Khách du lịch</Text>
          </View>
          <Pressable onPress={onPartnerPress} className="flex-1 flex-row items-center justify-center py-2">
            <Icon name="storefront-outline" color={C.muted} size={16} />
            <Text className="ml-1 text-[12px] font-semibold" style={{ color: C.muted }}>Đối tác</Text>
          </Pressable>
        </View>

        <View className="mt-4 flex-row items-center justify-between px-4">
          <View className="flex-1">
            <Text className="text-[18px] font-bold" style={{ color: C.text }}>Xin chào, {displayName} 👋</Text>
            <Text className="mt-1 text-[11px]" style={{ color: C.muted }}>Khám phá Việt Nam theo cách riêng của bạn</Text>
          </View>
          <ActionIcon name="bell-outline" badge onPress={onNotificationPress} />
          <View className="ml-2"><ActionIcon name="compass" onPress={onPlanTripPress} /></View>
        </View>

        <View className="mx-4 mt-4 flex-row items-center rounded-2xl bg-white px-3 py-2" style={{ elevation: 2 }}>
          <Icon name="magnify" size={23} color={C.primary} />
          <TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => onSearch?.(query)}
                     returnKeyType="search" placeholder="Bạn muốn đi đâu ở Việt Nam hôm nay?"
                     placeholderTextColor="#87918F" className="ml-2 h-9 flex-1 text-[12px]" style={{ color: C.text }} />
          <ActionIcon name="microphone-outline"
                      onPress={() => Alert.alert('Tìm kiếm giọng nói', 'Sẽ tích hợp ở giai đoạn tiếp theo.')} />
          <View className="ml-1"><ActionIcon name="tune-variant" onPress={onFilterPress} /></View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          {homeCategories.map(item => (
            <Pressable key={item.label} onPress={() => setHomeCategory(item.label)}
                       className="mr-2 flex-row items-center rounded-full px-4 py-2"
                       style={{ backgroundColor: homeCategory === item.label ? C.primary : C.white }}>
              <Icon name={item.icon} size={16} color={homeCategory === item.label ? 'white' : C.primary} />
              <Text className="ml-1.5 text-[12px] font-semibold"
                    style={{ color: homeCategory === item.label ? 'white' : C.text }}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <ImageBackground source={{ uri: heroImage }} className="mx-4 h-56 overflow-hidden rounded-2xl"
                         imageStyle={{ borderRadius: 16 }}>
          <View className="flex-1 justify-end bg-black/45 p-5">
            <Text className="mb-2 self-start overflow-hidden rounded-full bg-white px-3 py-1 text-[10px] font-semibold"
                  style={{ color: C.primary }}>⭐ Tự thiết kế lộ trình</Text>
            <Text className="text-[21px] font-extrabold leading-7 text-white">Tạo lịch trình mơ ước trong tích tắc</Text>
            <Text className="mb-3 mt-1 text-[11px] text-white">Tùy biến lịch trình trải nghiệm theo sở thích và ngân sách</Text>
            <Pressable onPress={onPlanTripPress} className="self-start rounded-full px-5 py-3"
                       style={{ backgroundColor: C.primary }}>
              <Text className="text-[12px] font-bold text-white">Lập kế hoạch chuyến đi →</Text>
            </Pressable>
          </View>
        </ImageBackground>

        {/* Thay toàn bộ 3 khối điểm đến cũ bằng 1 khu quảng cáo đối tác hoàn chỉnh */}
        <PartnerShowcase onAdPress={openAd} onPartnerPress={onPartnerPress} />

        {/* Giữ nguyên thiết lập sở thích */}
        <View className="mx-4 mt-6 rounded-2xl bg-white p-4" style={{ elevation: 2 }}>
          <View className="flex-row items-center">
            <View className="flex-1 pr-3">
              <Text className="text-[14px] font-bold" style={{ color: C.text }}>Hoàn thiện sở thích du lịch</Text>
              <Text className="mt-1 text-[12px]" style={{ color: C.muted }}>để nhận gợi ý phù hợp hơn</Text>
            </View>
            <View className="h-16 w-20 items-center justify-center rounded-2xl bg-[#E3F7F3]">
              <Icon name="map-marker-radius-outline" size={30} color={C.teal} />
              <View className="absolute right-2 top-2"><Icon name="star-four-points" size={12} color="#F5B53F" /></View>
            </View>
          </View>
          <Pressable onPress={onSetupPreferencesPress} className="mt-3 h-11 items-center justify-center rounded-full"
                     style={{ backgroundColor: C.primary }}>
            <Text className="text-[13px] font-bold text-white">Thiết lập sở thích</Text>
          </Pressable>
        </View>
      </ScrollView>
      <BottomTabBar activeTab="home" onTabPress={tab => onTabPress?.(tab)} />
    </SafeAreaView>
  );
}
