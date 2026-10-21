import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Destination,
  heroImage,
  popularDestinations,
  suggestedPlaces,
} from '../../constants/homeData';
import BottomTabBar, { type AppTab } from '../../components/BottomTabBar';
import AppLogo from '../../components/AppLogo';
const C = {
  primary: '#00685F',
  teal: '#008378',
  background: '#FAF8FF',
  text: '#131B2E',
  muted: '#64716F',
  surface: '#FFFFFF',
  pale: '#F2F3FF',
};
type IconName = React.ComponentProps<typeof Icon>['name'];
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

  // Điều hướng đến Business Owner
  onPartnerPress?: () => void;

  // Mở màn Sở thích du lịch
  onSetupPreferencesPress?: () => void;
};
function ActionIcon({
  name,
  onPress,
  badge = false,
}: {
  name: IconName;
  onPress?: () => void;
  badge?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F3FF]"
    >
      <Icon name={name} size={21} color={C.primary} />
      {badge && <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />}
    </Pressable>
  );
}
function Heading({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="mb-3 flex-row items-center justify-between px-4">
      <View className="flex-1 pr-3">
        <Text className="text-[18px] font-bold" style={{ color: C.text }}>
          {title}
        </Text>
        {subtitle && (
          <Text className="mt-0.5 text-[11px]" style={{ color: C.muted }}>
            {subtitle}
          </Text>
        )}
      </View>
      {action && (
        <Pressable onPress={onAction}>
          <Text className="text-[12px] font-semibold" style={{ color: C.primary }}>
            {action} ›
          </Text>
        </Pressable>
      )}
    </View>
  );
}
function DestinationCard({
  item,
  onPress,
}: {
  item: Destination;
  onPress?: (item: Destination) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress?.(item)}
      className="mr-3 w-60 overflow-hidden rounded-2xl bg-white"
      style={{ elevation: 2 }}
    >
      <Image source={{ uri: item.image }} className="h-36 w-full" resizeMode="cover" />
      <View className="p-3">
        <View className="flex-row justify-between">
          <Text className="flex-1 text-[14px] font-bold" style={{ color: C.text }}>
            {item.name}
          </Text>
          <Text className="text-[11px]" style={{ color: '#B17B17' }}>
            ★ {item.rating}
          </Text>
        </View>
        <Text className="mt-1 text-[11px]" style={{ color: C.muted }}>
          📍 {item.location}
        </Text>
        <Text className="mt-2 text-[11px] font-semibold" style={{ color: C.primary }}>
          Khám phá điểm đến →
        </Text>
      </View>
    </Pressable>
  );
}
export default function HomeScreen({
  displayName = 'Hoàng Nam',
  onTabPress,
  onSearch,
  onFilterPress,
  onNotificationPress,
  onProfilePress,
  onPartnerPress,
  onPlanTripPress,
  onDestinationPress,
  onViewAllPress,
  onSetupPreferencesPress,
}: HomeScreenProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const categories: { label: string; icon: IconName }[] = [
    { label: 'Tất cả', icon: 'compass-outline' },
    { label: 'Vịnh biển', icon: 'sail-boat' },
    { label: 'Núi cao', icon: 'image-filter-hdr' },
    { label: 'Di sản', icon: 'temple-buddhist' },
    { label: 'Ẩm thực', icon: 'silverware-fork-knife' },
  ];
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('vi');
    return q
      ? popularDestinations.filter((x) =>
          `${x.name} ${x.location}`.toLocaleLowerCase('vi').includes(q),
        )
      : popularDestinations;
  }, [query]);
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{ backgroundColor: C.background }}
    >
      {/* Bottom tab navigation intentionally belongs to the team's navigator. */}
      <View className="h-16 flex-row items-center justify-between bg-[#FAF8FF] px-4">
        <AppLogo />
        <View className="flex-row items-center gap-2">
          <Pressable className="rounded-full bg-[#EAEDFF] px-2 py-1">
            <Text className="text-[11px] font-bold" style={{ color: C.primary }}>
              🌐 VI | EN
            </Text>
          </Pressable>
          <ActionIcon name="bell-outline" badge onPress={onNotificationPress} />
          <Pressable
            onPress={onProfilePress}
            className="h-9 w-9 items-center justify-center rounded-full bg-[#99EFE5]"
          >
            <Icon name="account" size={20} color={C.primary} />
          </Pressable>
        </View>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View className="mx-4 mt-2 flex-row rounded-full bg-[#F2F3FF] p-1">
          <View
            className="flex-1 flex-row items-center justify-center rounded-full py-2"
            style={{ backgroundColor: C.primary }}
          >
            <Icon name="compass-outline" color="white" size={16} />
            <Text className="ml-1 text-[12px] font-bold text-white">Khách du lịch</Text>
          </View>
          <Pressable
            onPress={onPartnerPress}
            className="flex-1 flex-row items-center justify-center py-2"
          >
            <Icon name="storefront-outline" color={C.muted} size={16} />
           <Pressable onPress={onPartnerPress}>
  <Text>Đối tác</Text>
</Pressable>
          </Pressable>
        </View>
        <View className="mt-4 flex-row items-center justify-between px-4">
          <View className="flex-1">
            <Text className="text-[18px] font-bold" style={{ color: C.text }}>
              Xin chào, {displayName} 👋
            </Text>
            <Text className="mt-1 text-[11px]" style={{ color: C.muted }}>
              Khám phá Việt Nam theo cách riêng của bạn
            </Text>
          </View>
          <ActionIcon name="bell-outline" badge onPress={onNotificationPress} />
          <View className="ml-2">
            <ActionIcon name="compass" onPress={onPlanTripPress} />
          </View>
        </View>
        <View
          className="mx-4 mt-4 flex-row items-center rounded-2xl bg-white px-3 py-2"
          style={{ elevation: 2 }}
        >
          <Icon name="magnify" size={23} color={C.primary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => onSearch?.(query)}
            returnKeyType="search"
            placeholder="Bạn muốn đi đâu ở Việt Nam hôm nay?"
            placeholderTextColor="#87918F"
            className="ml-2 h-9 flex-1 text-[12px]"
            style={{ color: C.text }}
          />
          <ActionIcon
            name="microphone-outline"
            onPress={() => Alert.alert('Tìm kiếm giọng nói', 'Sẽ tích hợp ở giai đoạn tiếp theo.')}
          />
          <View className="ml-1">
            <ActionIcon name="tune-variant" onPress={onFilterPress} />
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        >
          {categories.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => setCategory(item.label)}
              className="mr-2 flex-row items-center rounded-full px-4 py-2"
              style={{ backgroundColor: category === item.label ? C.primary : '#FFFFFF' }}
            >
              <Icon
                name={item.icon}
                size={16}
                color={category === item.label ? 'white' : C.primary}
              />
              <Text
                className="ml-1.5 text-[12px] font-semibold"
                style={{ color: category === item.label ? 'white' : C.text }}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <ImageBackground
          source={{ uri: heroImage }}
          className="mx-4 h-56 overflow-hidden rounded-2xl"
          imageStyle={{ borderRadius: 16 }}
        >
          <View className="flex-1 justify-end bg-black/45 p-5">
            <Text
              className="mb-2 self-start overflow-hidden rounded-full bg-white px-3 py-1 text-[10px] font-semibold"
              style={{ color: C.primary }}
            >
              ⭐ Tự thiết kế lộ trình
            </Text>
            <Text className="text-[21px] font-extrabold leading-7 text-white">
              Tạo lịch trình mơ ước trong tích tắc
            </Text>
            <Text className="mb-3 mt-1 text-[11px] text-white">
              Tùy biến lịch trình trải nghiệm theo sở thích và ngân sách
            </Text>
            <Pressable
              onPress={onPlanTripPress}
              className="self-start rounded-full px-5 py-3"
              style={{ backgroundColor: C.primary }}
            >
              <Text className="text-[12px] font-bold text-white">Lập kế hoạch chuyến đi →</Text>
            </Pressable>
          </View>
        </ImageBackground>
        <View className="mt-5">
          <Heading
            title="Điểm đến phổ biến"
            subtitle="Top địa danh được yêu thích nhất cả nước"
            action="Tất cả"
            onAction={onViewAllPress}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 5 }}
          >
            {filtered.length ? (
              filtered.map((item) => (
                <DestinationCard key={item.id} item={item} onPress={onDestinationPress} />
              ))
            ) : (
              <Text className="py-6" style={{ color: C.muted }}>
                Không có điểm đến phù hợp
              </Text>
            )}
          </ScrollView>
        </View>
        <View className="mt-5">
          <Heading
            title="Gợi ý cho bạn"
            subtitle="Lựa chọn từ những trải nghiệm nổi bật"
            action="✦"
            onAction={onViewAllPress}
          />
          <View className="px-4">
            {suggestedPlaces.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onDestinationPress?.(item)}
                className="mb-3 flex-row items-center rounded-2xl bg-white p-2"
                style={{ elevation: 1 }}
              >
                <Image source={{ uri: item.image }} className="h-20 w-24 rounded-xl" />
                <View className="ml-3 flex-1">
                  <View className="flex-row justify-between">
                    <Text className="flex-1 text-[13px] font-bold" style={{ color: C.text }}>
                      {item.name}
                    </Text>
                    <Text className="text-[11px]" style={{ color: '#B17B17' }}>
                      ★ {item.rating}
                    </Text>
                  </View>
                  <Text className="mt-1 text-[11px]" style={{ color: C.muted }}>
                    {item.location}
                  </Text>
                  <Text className="mt-2 text-[11px] font-semibold" style={{ color: C.primary }}>
                    Tham quan tự do
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
        <View className="mt-3">
          <Heading
            title="Địa điểm xu hướng"
            subtitle="Check-in nổi bật nhất tuần này"
            action="Xem thêm"
            onAction={onViewAllPress}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {popularDestinations.map((item) => (
              <DestinationCard key={item.id} item={item} onPress={onDestinationPress} />
            ))}
          </ScrollView>
        </View>

        {/* Hoàn thiện sở thích du lịch */}
        <View
          className="mx-4 mt-5 rounded-2xl bg-white p-4"
          style={{ elevation: 2 }}
        >
          <View className="flex-row items-center">
            <View className="flex-1 pr-3">
              <Text className="text-[14px] font-bold" style={{ color: C.text }}>
                Hoàn thiện sở thích du lịch
              </Text>
              <Text className="mt-1 text-[12px]" style={{ color: C.muted }}>
                để nhận gợi ý phù hợp hơn
              </Text>
            </View>
            <View className="h-16 w-20 items-center justify-center rounded-2xl bg-[#E3F7F3]">
              <Icon name="map-marker-radius-outline" size={30} color={C.teal} />
              <View className="absolute right-2 top-2">
                <Icon name="star-four-points" size={12} color="#F5B53F" />
              </View>
            </View>
          </View>
          <Pressable
            onPress={onSetupPreferencesPress}
            className="mt-3 h-11 items-center justify-center rounded-full active:opacity-80"
            style={{ backgroundColor: C.primary }}
          >
            <Text className="text-[13px] font-bold text-white">Thiết lập sở thích</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BottomTabBar activeTab="home" onTabPress={(tab) => onTabPress?.(tab)} />
    </SafeAreaView>
  );
}
