import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../auth/NotificationsProvider';
import { useRootNav } from '../navigation/hooks';
import { openNotificationLink } from '../screens/notifications/NotificationsScreen';
import { colors, shadow } from '../theme';
import { Icon, type IconName } from '../ui/Icon';
import { Text } from '../ui/Typography';

function iconFor(type: string): { name: IconName; bg: string; fg: string } {
  if (type.startsWith('WEATHER_SEVERE')) {
    return { name: 'thunderstorm', bg: '#FEE2E2', fg: '#DC2626' };
  }
  if (type.startsWith('WEATHER_')) {
    return { name: 'umbrella', bg: '#FEF3C7', fg: '#D97706' };
  }
  if (type.startsWith('TRIP_')) {
    return { name: 'luggage', bg: '#E0F2FE', fg: '#0284C7' };
  }
  if (type.includes('REVIEW')) {
    return { name: 'rate-review', bg: '#DCFCE7', fg: '#16A34A' };
  }
  return { name: 'notifications-active', bg: '#ECFEFF', fg: colors.primary };
}

/**
 * Banner thông báo realtime trượt từ trên xuống (đồng bộ toast realtime của Web).
 * Bấm vào banner để nhảy thẳng tới màn hình liên quan (lịch trình ngày, địa điểm…).
 */
export default function LiveNotificationBanner() {
  const { banner, dismissBanner } = useNotifications();
  const navigation = useRootNav();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-110)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const countdown = useRef(new Animated.Value(0)).current;
  const [cardWidth, setCardWidth] = useState(320);

  useEffect(() => {
    if (!banner) return;
    translateY.setValue(-110);
    opacity.setValue(0);
    countdown.setValue(0);
    const enter = Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(countdown, {
        toValue: 1,
        duration: 5_500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);
    enter.start();
    return () => enter.stop();
  }, [banner, countdown, opacity, translateY]);

  if (!banner) return null;
  const tone = iconFor(banner.type);
  const barTranslateX = countdown.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -cardWidth],
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: insets.top + 8,
          left: 14,
          right: 14,
          zIndex: 999,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) setCardWidth(w);
        }}
        onPress={() => {
          const link = banner.link;
          dismissBanner();
          if (link) {
            openNotificationLink(navigation, link);
          } else {
            navigation.navigate('Notifications');
          }
        }}
        style={[
          shadow.raised,
          {
            borderRadius: 20,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#D6EEF2',
            overflow: 'hidden',
          },
        ]}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 13,
              backgroundColor: tone.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={tone.name} size={22} color={tone.fg} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} className="text-[13.5px] font-extrabold text-[#0F2A3B]">
              {banner.title}
            </Text>
            {banner.message ? (
              <Text numberOfLines={2} className="mt-0.5 text-[12px] leading-[17px] text-[#557080]">
                {banner.message}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={dismissBanner} hitSlop={10} accessibilityLabel="Đóng thông báo">
            <Icon name="close" size={18} color="#94A3B8" />
          </Pressable>
        </View>
        {/* Thanh đếm ngược 5.5 giây mảnh ở đáy banner */}
        <View style={{ height: 3, width: '100%', backgroundColor: tone.bg, overflow: 'hidden' }}>
          <Animated.View
            style={{
              height: '100%',
              width: '100%',
              backgroundColor: tone.fg,
              transform: [{ translateX: barTranslateX }],
            }}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}
