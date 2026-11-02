import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppLogo from './AppLogo';

// Header dùng chung cho 5 màn chính (Trang chủ, Khám phá, Chuyến đi, Yêu thích, Hồ sơ)
// Giống header của màn Home: logo + VI|EN + chuông thông báo + avatar

const COLORS = {
  primary: '#00685F',
  background: '#FAF8FF',
  pale: '#F2F3FF',
  languageBg: '#EAEDFF',
  avatarBg: '#99EFE5',
};

type AppHeaderProps = {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onLanguagePress?: () => void;
  /** Hiện chấm đỏ trên chuông */
  hasNotification?: boolean;
};

const comingSoon = (title: string) => () =>
  Alert.alert(title, 'Chức năng đang phát triển.');

export default function AppHeader({
  onNotificationPress = comingSoon('Thông báo'),
  onProfilePress,
  onLanguagePress = comingSoon('Ngôn ngữ'),
  hasNotification = true,
}: AppHeaderProps) {
  return (
    <View
      className="h-16 flex-row items-center justify-between px-4"
      style={{ backgroundColor: COLORS.background }}
    >
      <AppLogo />

      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={onLanguagePress}
          className="flex-row items-center rounded-full px-2 py-1"
          style={{ backgroundColor: COLORS.languageBg }}
          accessibilityLabel="Đổi ngôn ngữ"
        >
          <MaterialCommunityIcons name="web" size={13} color={COLORS.primary} />
          <Text className="ml-1 text-[11px] font-bold" style={{ color: COLORS.primary }}>
            VI | EN
          </Text>
        </Pressable>

        <Pressable
          onPress={onNotificationPress}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: COLORS.pale }}
          accessibilityLabel="Thông báo"
        >
          <MaterialCommunityIcons name="bell-outline" size={21} color={COLORS.primary} />
          {hasNotification && (
            <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Pressable>

        <Pressable
          onPress={onProfilePress}
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: COLORS.avatarBg }}
          accessibilityLabel="Hồ sơ"
        >
          <MaterialCommunityIcons name="account" size={20} color={COLORS.primary} />
        </Pressable>
      </View>
    </View>
  );
}
