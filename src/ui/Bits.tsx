import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Text } from './Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from '../theme';
import { Icon, type IconName } from './Icon';
import { ScalePressable, ShimmerBox } from './Motion';

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const base: ViewStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    ...shadow.card,
  };
  if (onPress) {
    return (
      <ScalePressable scaleTo={0.975} onPress={onPress} style={[base, style]}>
        {children}
      </ScalePressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

/** Nút lựa chọn dạng viên thuốc — có hiệu ứng nhún lò xo */
export function Chip({
  label,
  selected,
  onPress,
  icon,
  count,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  count?: number;
}) {
  return (
    <ScalePressable
      scaleTo={0.94}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.line,
        backgroundColor: selected ? colors.primary : '#FFFFFF',
      }}
    >
      {icon ? (
        <Icon name={icon} size={16} color={selected ? '#FFFFFF' : colors.primaryStrong} />
      ) : null}
      <Text style={{ fontSize: 12.5, fontWeight: '700', color: selected ? '#FFFFFF' : colors.ink }}>
        {label}
        {count !== undefined ? ` (${count})` : ''}
      </Text>
    </ScalePressable>
  );
}

export function Badge({
  label,
  bg = colors.primarySoft,
  fg = colors.primaryStrong,
  icon,
}: {
  label: string;
  bg?: string;
  fg?: string;
  icon?: IconName;
}) {
  return (
    <View
      style={{ backgroundColor: bg }}
      className="flex-row items-center gap-1 self-start rounded-full px-2.5 py-1"
    >
      {icon ? <Icon name={icon} size={13} color={fg} /> : null}
      <Text style={{ color: fg }} className="text-[10.5px] font-bold">
        {label}
      </Text>
    </View>
  );
}

function StarItem({
  star,
  name,
  size,
  onPress,
}: {
  star: number;
  name: IconName;
  size: number;
  onPress: () => void;
}) {
  const pop = useRef(new Animated.Value(1)).current;
  const trigger = () => {
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.32, duration: 100, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 10 }),
    ]).start();
    onPress();
  };
  return (
    <Pressable onPress={trigger} accessibilityLabel={`${star} sao`} hitSlop={4}>
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <Icon name={name} size={size} color="#E0A100" />
      </Animated.View>
    </Pressable>
  );
}

/** Hiển thị (và chọn) số sao — có hiệu ứng sao nảy nhẹ khi bấm chọn */
export function Stars({
  value,
  size = 16,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (value: number) => void;
}) {
  return (
    <View className="flex-row" style={{ gap: onChange ? 6 : 1 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const name: IconName =
          value >= star ? 'star' : value >= star - 0.5 ? 'star-half' : 'star-border';
        return onChange ? (
          <StarItem key={star} star={star} name={name} size={size} onPress={() => onChange(star)} />
        ) : (
          <View key={star}>
            <Icon name={name} size={size} color="#E0A100" />
          </View>
        );
      })}
    </View>
  );
}

export function Avatar({
  name,
  url,
  size = 44,
}: {
  name?: string | null;
  url?: string | null;
  size?: number;
}) {
  const initials = (name ?? '?')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.pale }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.pale,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: colors.primaryStrong, fontWeight: '800', fontSize: size * 0.36 }}>
        {initials || '?'}
      </Text>
    </View>
  );
}

/** Header User-Agent giúp Android OkHttp tải được ảnh từ các nguồn chặn bot như Wikimedia */
export const remoteImageSource = (uri: string) => ({
  uri,
  headers: { 'User-Agent': 'SmartTravelApp/1.0 (https://smarttravel.vn)' },
});

/** Ảnh có khung shimmer lúc đang tải và hiện mờ dần mượt (`fade-in`) khi tải xong */
export function Cover({
  uri,
  height,
  radius = 0,
  icon = 'landscape',
  style,
}: {
  uri?: string | null;
  height: number;
  radius?: number;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const [loaded, setLoaded] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLoaded(false);
    opacity.setValue(0);
  }, [uri, opacity]);

  const onLoadEnd = () => {
    setLoaded(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  return (
    <View
      style={[
        { height, borderRadius: radius, overflow: 'hidden', backgroundColor: '#D8F1F5' },
        style,
      ]}
    >
      {uri ? (
        <>
          {!loaded ? (
            <ShimmerBox
              height={height}
              borderRadius={radius}
              style={StyleSheet.absoluteFillObject}
            />
          ) : null}
          <Animated.Image
            source={remoteImageSource(uri)}
            onLoadEnd={onLoadEnd}
            style={{ width: '100%', height: '100%', opacity }}
            resizeMode="cover"
          />
        </>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Icon name={icon} size={Math.min(44, height / 3)} color="#7CC3D2" />
        </View>
      )}
    </View>
  );
}

/** Bảng trượt từ dưới lên mượt kèm nền mờ dần (backdrop fade + spring slide) */
export function Sheet({
  visible,
  onClose,
  title,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const backdrop = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    if (!visible) return;
    backdrop.setValue(0);
    slideY.setValue(60);
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 22,
        bounciness: 5,
      }),
    ]).start();
  }, [visible, backdrop, slideY]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: 'rgba(8,24,33,0.46)', opacity: backdrop },
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={{
            maxHeight: '88%',
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            paddingBottom: Math.max(insets.bottom, 12),
            transform: [{ translateY: slideY }],
          }}
        >
          <View className="items-center pt-2.5">
            <View className="h-1.5 w-10 rounded-full bg-[#D5E3E8]" />
          </View>
          <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
            <Text className="flex-1 text-[17px] font-extrabold text-[#0F2A3B]">{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Đóng">
              <Icon name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {footer ? <View className="px-5 pt-2">{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

/** Thanh tiến trình các bước của luồng lập kế hoạch (6 bước như web) — vạch hiện tại lấp đầy mượt */
export function FlowProgress({ current, total = 6 }: { current: number; total?: number }) {
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fill.setValue(0);
    Animated.timing(fill, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [current, fill]);

  return (
    <View className="flex-row gap-1.5 px-4 pb-1 pt-3">
      {Array.from({ length: total }, (_, i) => {
        const done = i < current - 1;
        const active = i === current - 1;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              backgroundColor: done ? colors.primaryStrong : '#E3E8EF',
              overflow: 'hidden',
            }}
          >
            {active ? (
              <Animated.View
                style={{
                  flex: 1,
                  borderRadius: 3,
                  backgroundColor: colors.primaryStrong,
                  transform: [{ scaleX: fill }],
                }}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
