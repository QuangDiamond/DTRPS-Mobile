import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Icon, type IconName } from '../ui/Icon';
import { Text } from '../ui/Typography';
import type { TabParamList } from './types';

export const TAB_ITEMS: Record<keyof TabParamList, { icon: IconName; label: string }> = {
  Home: { icon: 'home', label: 'Trang chủ' },
  Explore: { icon: 'explore', label: 'Khám phá' },
  Trips: { icon: 'luggage', label: 'Chuyến đi' },
  Favorites: { icon: 'favorite', label: 'Yêu thích' },
  Profile: { icon: 'person', label: 'Tài khoản' },
};

function TabButton({
  icon,
  label,
  focused,
  onPress,
  onLongPress,
}: {
  icon: IconName;
  label: string;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const iconScale = useRef(new Animated.Value(focused ? 1.06 : 1)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (focused) {
      Animated.sequence([
        Animated.timing(iconScale, { toValue: 1.22, duration: 115, useNativeDriver: true }),
        Animated.spring(iconScale, {
          toValue: 1.06,
          useNativeDriver: true,
          speed: 24,
          bounciness: 10,
        }),
      ]).start();
    } else {
      Animated.spring(iconScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 28,
        bounciness: 4,
      }).start();
    }
  }, [focused, iconScale]);

  const onPressIn = () =>
    Animated.spring(pressScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  const onPressOut = () =>
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
        paddingBottom: 4,
      }}
    >
      <Animated.View style={{ alignItems: 'center', transform: [{ scale: pressScale }] }}>
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <Icon name={icon} size={23} color={focused ? colors.primary : '#8193A0'} />
        </Animated.View>
        <Text
          numberOfLines={1}
          style={{
            marginTop: 3,
            fontSize: 10.5,
            fontWeight: focused ? '800' : '600',
            color: focused ? colors.primary : '#8193A0',
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Thanh Bottom Tab Bar có hiệu ứng:
 * - Thanh gạch trên cùng + nền pill trượt lò xo mượt theo tab đang chọn
 * - Icon nảy nhẹ khi chạm chuyển tab
 */
export default function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const count = state.routes.length;
  const tabWidth = barWidth > 0 ? barWidth / count : 0;

  const slideX = useRef(new Animated.Value(0)).current;
  const initialized = useRef(false);

  useEffect(() => {
    if (tabWidth <= 0) return;
    const target = state.index * tabWidth;
    if (!initialized.current) {
      initialized.current = true;
      slideX.setValue(target);
      return;
    }
    Animated.spring(slideX, {
      toValue: target,
      useNativeDriver: true,
      speed: 22,
      bounciness: 6,
    }).start();
  }, [state.index, tabWidth, slideX]);

  return (
    <View
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth > 0 && nextWidth !== barWidth) setBarWidth(nextWidth);
      }}
      style={{
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5F1F4',
        paddingBottom: Math.max(insets.bottom, 6),
        elevation: 10,
        shadowColor: '#0F2A3B',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
        position: 'relative',
      }}
    >
      {/* Thanh trượt lò xo + nền pill mềm phía sau tab đang chọn */}
      {tabWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: tabWidth,
            alignItems: 'center',
            transform: [{ translateX: slideX }],
          }}
        >
          <View
            style={{
              width: 34,
              height: 3,
              borderBottomLeftRadius: 3,
              borderBottomRightRadius: 3,
              backgroundColor: colors.primary,
            }}
          />
          <View
            style={{
              marginTop: 3,
              width: Math.min(tabWidth - 14, 58),
              height: 30,
              borderRadius: 15,
              backgroundColor: '#ECFEFF',
            }}
          />
        </Animated.View>
      ) : null}

      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const meta = TAB_ITEMS[route.name as keyof TabParamList];
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };
        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };
        void descriptors;

        return (
          <TabButton
            key={route.key}
            icon={meta.icon}
            label={meta.label}
            focused={focused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}
