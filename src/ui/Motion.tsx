import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Khung xương lấp lánh (đồng bộ hiệu ứng `.shimmer` của Web).
 * Chạy hoàn toàn trên native driver (60fps) bằng LinearGradient trượt ngang.
 */
export function ShimmerBox({
  width = '100%',
  height,
  borderRadius = 12,
  style,
}: {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [boxWidth, setBoxWidth] = useState(240);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1350,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-boxWidth, boxWidth],
  });

  const onLayout = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    if (w > 0) setBoxWidth(w);
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E3EEF0',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { width: boxWidth, transform: [{ translateX }] }]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.62)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

/** Khung xương cho thẻ địa điểm (Khám phá / Yêu thích / Trang chủ) */
export function PlaceCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <View className="overflow-hidden rounded-[22px] border border-[#E3E9E9] bg-white">
      <ShimmerBox height={compact ? 130 : 180} borderRadius={0} />
      <View className={compact ? 'gap-2 p-3' : 'gap-2.5 p-4'}>
        <ShimmerBox width="35%" height={11} borderRadius={6} />
        <ShimmerBox width="82%" height={17} borderRadius={8} />
        {!compact ? <ShimmerBox width="64%" height={13} borderRadius={6} /> : null}
        <View className="mt-1 flex-row items-center justify-between border-t border-[#EDF1EE] pt-3">
          <ShimmerBox width={88} height={14} borderRadius={7} />
          <ShimmerBox width={68} height={14} borderRadius={7} />
        </View>
      </View>
    </View>
  );
}

/** Khung xương cho màn hình Chi tiết địa điểm */
export function PlaceDetailSkeleton() {
  return (
    <View className="gap-4 pb-8">
      <ShimmerBox height={270} borderRadius={0} />
      <View className="gap-3 px-4">
        <ShimmerBox width="30%" height={12} borderRadius={6} />
        <ShimmerBox width="80%" height={24} borderRadius={10} />
        <ShimmerBox width="60%" height={14} borderRadius={7} />
        <View className="mt-2 flex-row flex-wrap justify-between gap-y-3">
          <ShimmerBox width="48%" height={92} borderRadius={16} />
          <ShimmerBox width="48%" height={92} borderRadius={16} />
          <ShimmerBox width="48%" height={92} borderRadius={16} />
          <ShimmerBox width="48%" height={92} borderRadius={16} />
        </View>
        <ShimmerBox height={120} borderRadius={18} />
      </View>
    </View>
  );
}

/**
 * Hiệu ứng hiện mượt từ dưới lên (đồng bộ `.page-enter` của Web, hỗ trợ `delay` xếp tầng).
 */
export function FadeInView({
  children,
  delay = 0,
  offset = 12,
  duration = 280,
  style,
}: {
  children: ReactNode;
  delay?: number;
  offset?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(offset)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

/**
 * Nút / thẻ có hiệu ứng nhấn nhún lò xo mượt (spring scale 0.97).
 */
export function ScalePressable({
  children,
  scaleTo = 0.97,
  style,
  className,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableProps & {
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 36,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        {...rest}
        disabled={disabled}
        className={className}
        style={style}
        onPressIn={(event) => {
          if (!disabled) animateTo(scaleTo);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          animateTo(1);
          onPressOut?.(event);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Thanh tiến độ chạy mượt cho slide quảng cáo đối tác (đồng bộ `@keyframes slideProgress` của Web).
 */
export function SlideProgressBar({
  durationMs,
  activeKey,
  paused,
}: {
  durationMs: number;
  activeKey: string | number;
  paused: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const [barWidth, setBarWidth] = useState(300);

  useEffect(() => {
    progress.setValue(0);
    if (paused) return;
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [activeKey, durationMs, paused, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-barWidth, 0],
  });

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setBarWidth(w);
      }}
      style={{
        height: 3,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.22)',
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: '#FFFFFF',
          transform: [{ translateX }],
        }}
      />
    </View>
  );
}

/**
 * Vòng sáng nhịp thở (pulse) dùng cho màn hình AI đang tạo gợi ý.
 */
export function PulseRing({ size = 180, color = '#0891B2' }: { size?: number; color?: string }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.68, 1.15] });
  const opacity = pulse.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.35, 0.18, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

/**
 * Vệt sáng lướt ngang định kỳ trên nút CTA chính (đồng bộ `.btn-shine` của Web).
 * Đặt bên trong nút có `overflow: 'hidden'`.
 */
export function ShineSweep({ intervalMs = 3200 }: { intervalMs?: number }) {
  const [width, setWidth] = useState(220);
  const pos = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(intervalMs),
        Animated.timing(pos, {
          toValue: 1,
          duration: 680,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pos, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [intervalMs, pos]);

  const translateX = pos.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.7, width * 1.2],
  });

  return (
    <View
      pointerEvents="none"
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setWidth(w);
      }}
      style={StyleSheet.absoluteFillObject}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: -10,
          bottom: -10,
          width: 64,
          transform: [{ translateX }, { skewX: '-20deg' }],
        }}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.42)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

/**
 * Thanh tiến độ chạy mượt khi phần trăm thay đổi (dùng cho Lịch trình ngày & Bản đồ chuyến đi).
 */
export function AnimatedProgressBar({
  percent,
  color = '#12B886',
  trackColor = '#E3E8EF',
  height = 8,
}: {
  percent: number;
  color?: string;
  trackColor?: string;
  height?: number;
}) {
  const [barWidth, setBarWidth] = useState(0);
  const clamped = Math.max(0, Math.min(100, percent));
  const anim = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, clamped]);

  const translateX = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [-barWidth, 0],
  });

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setBarWidth(w);
      }}
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: trackColor,
        overflow: 'hidden',
      }}
    >
      {barWidth > 0 ? (
        <Animated.View
          style={{
            width: barWidth,
            height: '100%',
            borderRadius: height / 2,
            backgroundColor: color,
            transform: [{ translateX }],
          }}
        />
      ) : null}
    </View>
  );
}

/** Khung xương gọn cho thẻ danh sách (Chuyến đi, Thông báo, Lịch trình) */
export function ListCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View className="gap-3">
      {Array.from({ length: count }, (_, idx) => (
        <View key={idx} className="gap-2.5 rounded-3xl border border-[#E5ECEF] bg-white p-4">
          <View className="flex-row items-center gap-3">
            <ShimmerBox width={42} height={42} borderRadius={14} />
            <View className="flex-1 gap-2">
              <ShimmerBox width="65%" height={15} borderRadius={7} />
              <ShimmerBox width="42%" height={12} borderRadius={6} />
            </View>
          </View>
          <ShimmerBox width="92%" height={12} borderRadius={6} />
        </View>
      ))}
    </View>
  );
}
