import { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Text } from '../ui/Typography';
import type { PlaceSummary } from '../api/types';
import { useFavorites } from '../auth/FavoritesProvider';
import { colors, shadow } from '../theme';
import { Cover } from '../ui/Bits';
import { Icon, type IconName } from '../ui/Icon';
import { ScalePressable } from '../ui/Motion';

export const GROUP_ICONS: Record<string, IconName> = {
  lodging: 'hotel',
  fnb: 'restaurant',
  attraction: 'attractions',
  shopping: 'shopping-bag',
};

/** Nút trái tim tròn nền trắng trên ảnh — có hiệu ứng tim nảy (`heartPop`) giống Web */
export function FavoriteButton({ placeId, size = 36 }: { placeId: number; size?: number }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(placeId);
  const pop = useRef(new Animated.Value(1)).current;
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (active) {
      Animated.sequence([
        Animated.timing(pop, { toValue: 1.32, duration: 120, useNativeDriver: true }),
        Animated.timing(pop, { toValue: 0.92, duration: 90, useNativeDriver: true }),
        Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 10 }),
      ]).start();
    } else {
      Animated.sequence([
        Animated.timing(pop, { toValue: 0.86, duration: 90, useNativeDriver: true }),
        Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }),
      ]).start();
    }
  }, [active, pop]);

  return (
    <Pressable
      onPress={() => toggleFavorite(placeId)}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
      accessibilityState={{ selected: active }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        },
        shadow.card,
      ]}
    >
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <Icon
          name={active ? 'favorite' : 'favorite-border'}
          size={size * 0.56}
          color={active ? '#D93B4A' : '#5C6B75'}
        />
      </Animated.View>
    </Pressable>
  );
}

/** Thẻ địa điểm ở Khám phá / Yêu thích — giống DestinationCard của web */
export default function PlaceCard({
  place,
  onPress,
  compact = false,
}: {
  place: PlaceSummary;
  onPress: () => void;
  compact?: boolean;
}) {
  const category = place.category?.name ?? place.group?.name ?? 'Điểm đến';
  const icon = GROUP_ICONS[place.group?.code ?? ''] ?? 'place';
  return (
    <ScalePressable
      scaleTo={0.975}
      onPress={onPress}
      style={shadow.card}
      className="overflow-hidden rounded-[22px] border border-[#E3E9E9] bg-white"
      accessibilityLabel={`Xem chi tiết ${place.name}`}
    >
      <View>
        <Cover uri={place.coverUrl} height={compact ? 130 : 180} />
        <View className="absolute bottom-2.5 left-2.5 max-w-[85%] flex-row items-center gap-1 rounded-full bg-white/95 px-2.5 py-1">
          <Icon name={icon} size={14} color="#265D6B" />
          <Text numberOfLines={1} className="text-[11px] font-bold text-[#265D6B]">
            {category}
          </Text>
        </View>
        <View className="absolute right-2.5 top-2.5">
          <FavoriteButton placeId={place.id} />
        </View>
      </View>
      <View className={compact ? 'p-3' : 'p-4'}>
        <Text className="text-[10px] font-extrabold uppercase tracking-[1.4px] text-[#0891B2]">
          {place.province?.name ?? 'Việt Nam'}
        </Text>
        <Text
          numberOfLines={2}
          className="mt-1 text-[15.5px] font-extrabold leading-[21px] text-[#193241]"
        >
          {place.name}
        </Text>
        {!compact ? (
          <View className="mt-1.5 flex-row items-start gap-1">
            <Icon name="location-on" size={15} color={colors.primary} style={{ marginTop: 1 }} />
            <Text numberOfLines={2} className="flex-1 text-[12px] leading-5 text-[#73868C]">
              {place.address || 'Địa chỉ đang cập nhật'}
            </Text>
          </View>
        ) : null}
        <View className="mt-3 flex-row items-center justify-between border-t border-[#EDF1EE] pt-3">
          <View className="flex-row items-center gap-1">
            <Icon name="star" size={17} color="#E9AD43" />
            <Text className="text-[13px] font-bold text-[#29434A]">
              {place.rating == null ? 'Mới' : place.rating.toFixed(1)}
            </Text>
            {place.rating != null ? (
              <Text className="text-[12px] text-[#9AA9A9]">· {place.reviewCount} đánh giá</Text>
            ) : null}
          </View>
          <View className="flex-row items-center gap-0.5">
            <Text className="text-[12px] font-extrabold text-[#0891B2]">Khám phá</Text>
            <Icon name="arrow-forward" size={16} color={colors.primary} />
          </View>
        </View>
      </View>
    </ScalePressable>
  );
}
