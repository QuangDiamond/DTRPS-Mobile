
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ==================== TYPES ====================

type IconName =
  React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type BottomTab =
  | 'home'
  | 'explore'
  | 'trip'
  | 'favorite'
  | 'profile';

type SettingsScreenProps = {
  onBackPress?: () => void;
  onEditProfilePress?: () => void;
  onMyTripsPress?: () => void;
  onFavoritePlacesPress?: () => void;
  onNotificationsPress?: () => void;
  onAppSettingsPress?: () => void;
  onLogoutPress?: () => void;
  onTabPress?: (tab: BottomTab) => void;
};

// ==================== COLORS ====================

const COLORS = {
  primary: '#0D9488',
  darkPrimary: '#087B74',
  title: '#173C50',
  text: '#344A61',
  subtitle: '#8C9AAE',
  background: '#F7F7FF',
  mint: '#D7F8F4',
  border: '#F0F1F7',
  white: '#FFFFFF',
};

// ==================== SECTION ====================

function SectionTitle({
                        title,
                      }: {
  title: string;
}) {
  return (
    <Text
      className="mb-3 mt-6 text-[12px] font-extrabold tracking-[0.5px]"
      style={{ color: COLORS.darkPrimary }}
    >
      {title}
    </Text>
  );
}

// ==================== ICON BOX ====================

function SettingIcon({
                       name,
                       color = COLORS.darkPrimary,
                     }: {
  name: IconName;
  color?: string;
}) {
  return (
    <View
      className="h-10 w-10 items-center justify-center rounded-xl"
      style={{ backgroundColor: COLORS.mint }}
    >
      <MaterialCommunityIcons
        name={name}
        size={21}
        color={color}
      />
    </View>
  );
}

// ==================== SETTING ITEM ====================

type SettingItemProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  value?: string;
  badge?: string;
  showArrow?: boolean;
  isLast?: boolean;
  onPress?: () => void;
};

function SettingItem({
                       icon,
                       title,
                       subtitle,
                       value,
                       badge,
                       showArrow = true,
                       isLast = false,
                       onPress,
                     }: SettingItemProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      className="flex-row items-center px-3 py-3.5"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: COLORS.border,
      }}
    >
      <SettingIcon name={icon} />

      <View className="ml-3 min-w-0 flex-1">
        <View className="flex-row items-center">
          <Text
            className="text-[13px] font-bold"
            style={{ color: COLORS.title }}
            numberOfLines={1}
          >
            {title}
          </Text>

          {badge && (
            <View className="ml-2 rounded-full bg-[#C6F3EB] px-2 py-0.5">
              <Text className="text-[9px] font-bold text-[#087B74]">
                {badge}
              </Text>
            </View>
          )}
        </View>

        <Text
          className="mt-1 text-[10px]"
          style={{ color: COLORS.subtitle }}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      </View>

      {value && (
        <Text
          className="ml-1 max-w-[105px] text-right text-[11px] font-semibold"
          style={{ color: COLORS.darkPrimary }}
          numberOfLines={1}
        >
          {value}
        </Text>
      )}

      {showArrow && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={21}
          color="#8C9CAC"
          style={{ marginLeft: 4 }}
        />
      )}
    </Pressable>
  );
}

// ==================== SWITCH ITEM ====================

type SettingSwitchProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  value: boolean;
  badge?: string;
  isLast?: boolean;
  onValueChange: (value: boolean) => void;
};

function SettingSwitchItem({
                             icon,
                             title,
                             subtitle,
                             value,
                             badge,
                             isLast = false,
                             onValueChange,
                           }: SettingSwitchProps) {
  return (
    <View
      className="flex-row items-center px-3 py-3"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: COLORS.border,
      }}
    >
      <SettingIcon name={icon} />

      <View className="ml-3 min-w-0 flex-1">
        <View className="flex-row flex-wrap items-center">
          <Text
            className="text-[13px] font-bold"
            style={{ color: COLORS.title }}
          >
            {title}
          </Text>

          {badge && (
            <View className="ml-1.5 rounded-full bg-[#C6F3EB] px-1.5 py-0.5">
              <Text className="text-[9px] font-bold text-[#087B74]">
                {badge}
              </Text>
            </View>
          )}
        </View>

        <Text
          className="mt-1 text-[10px]"
          style={{ color: COLORS.subtitle }}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: '#D5D8E0',
          true: '#0D9488',
        }}
        thumbColor="#FFFFFF"
        style={{
          transform: [
            { scaleX: 0.8 },
            { scaleY: 0.8 },
          ],
          marginLeft: 4,
        }}
      />
    </View>
  );
}

// ==================== MAIN SCREEN ====================

export default function SettingsScreen({
                                         onBackPress,
                                         onEditProfilePress,
                                         onLogoutPress,
                                       }: SettingsScreenProps) {

  // ==================== MOCK STATES ====================

  const [language, setLanguage] = useState('Tiếng Việt');

  const [currency, setCurrency] = useState('VND (₫)');

  const [displayMode, setDisplayMode] =
    useState('Sáng (Light Mode)');

  const [pushNotification, setPushNotification] =
    useState(true);

  const [tripReminder, setTripReminder] =
    useState(true);

  const [weatherNotification, setWeatherNotification] =
    useState(true);

  const [locationEnabled, setLocationEnabled] =
    useState(true);

  // ==================== FUNCTIONS ====================

  const showComingSoon = (title: string) => {
    Alert.alert(
      title,
      'Chức năng đang được phát triển.'
    );
  };

  const handleLanguage = () => {
    Alert.alert(
      'Ngôn ngữ',
      'Chọn ngôn ngữ hiển thị',
      [
        {
          text: 'Tiếng Việt',
          onPress: () => setLanguage('Tiếng Việt'),
        },
        {
          text: 'English',
          onPress: () => setLanguage('English'),
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCurrency = () => {
    Alert.alert(
      'Tiền tệ mặc định',
      'Chọn loại tiền tệ',
      [
        {
          text: 'VND (₫)',
          onPress: () => setCurrency('VND (₫)'),
        },
        {
          text: 'USD ($)',
          onPress: () => setCurrency('USD ($)'),
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ]
    );
  };

  const handleDisplayMode = () => {
    Alert.alert(
      'Chế độ hiển thị',
      'Chọn giao diện ứng dụng',
      [
        {
          text: 'Sáng (Light Mode)',
          onPress: () =>
            setDisplayMode('Sáng (Light Mode)'),
        },
        {
          text: 'Tối (Dark Mode)',
          onPress: () =>
            setDisplayMode('Tối (Dark Mode)'),
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ]
    );
  };

  const handleLogout = () => {
    if (onLogoutPress) {
      onLogoutPress();
      return;
    }

    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () =>
            showComingSoon('Đăng xuất'),
        },
      ]
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{
        backgroundColor: COLORS.background,
      }}
    >
      <StatusBar style="dark" />

      {/* ==================== HEADER ==================== */}

      <View className="h-[58px] flex-row items-center justify-between border-b border-[#ECEEF5] bg-white px-4">
        <View className="flex-row items-center">

          <Pressable
            onPress={onBackPress}
            className="mr-3 h-9 w-9 items-center justify-center"
            accessibilityLabel="Quay lại"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={23}
              color="#4C657B"
            />
          </Pressable>

          <View>
            <Text className="text-[17px] font-extrabold text-[#176E6C]">
              SmartTravel
            </Text>

            <Text className="text-[10px] text-[#8293A4]">
              Cài đặt ứng dụng
            </Text>
          </View>

        </View>

        <View className="h-9 w-9 items-center justify-center rounded-full bg-[#0D9488]">
          <MaterialCommunityIcons
            name="account"
            size={21}
            color="#FFFFFF"
          />
        </View>
      </View>

      {/* ==================== CONTENT ==================== */}

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: 14,
          paddingBottom: 24,
        }}
      >

        {/* ==================== USER PROFILE CARD ==================== */}

        <LinearGradient
          colors={['#DDFBF7', '#EAEDFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: 14,
            borderRadius: 20,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-[#99EFE7]">
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={33}
              color="#007B78"
            />
          </View>

          <View className="min-w-0 flex-1">
            <View className="flex-row items-center">
              <Text className="text-[15px] font-bold text-[#15384D]">
                Minh An Travel
              </Text>

              <View className="ml-2 rounded-full bg-[#D7F3ED] px-2 py-0.5">
                <Text className="text-[10px] font-bold text-[#07776D]">
                  ● Pro
                </Text>
              </View>
            </View>

            <Text
              className="mt-1 text-[10px] text-[#75869C]"
              numberOfLines={1}
            >
              minhan.journey@travel.vn
            </Text>
          </View>

          <Pressable
            onPress={onEditProfilePress}
            className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-[#DFE8FF]"
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={18}
              color="#087B74"
            />
          </Pressable>
        </LinearGradient>

        {/* ==================== GENERAL SETTINGS ==================== */}

        <SectionTitle title="TÙY CHỌN CHUNG" />

        <View className="overflow-hidden rounded-[18px] bg-white">

          <SettingItem
            icon="translate"
            title="Ngôn ngữ"
            subtitle="Language & Localization"
            value={language}
            onPress={handleLanguage}
          />

          <SettingItem
            icon="cash-multiple"
            title="Tiền tệ mặc định"
            subtitle="Định dạng giá vé & dịch vụ"
            value={currency}
            onPress={handleCurrency}
          />

          <SettingItem
            icon="weather-sunny"
            title="Chế độ hiển thị"
            subtitle="Giao diện màu sắc"
            value={displayMode}
            onPress={handleDisplayMode}
            isLast
          />

        </View>

        {/* ==================== NOTIFICATIONS ==================== */}

        <SectionTitle title="THÔNG BÁO & ĐỊNH VỊ" />

        <View className="overflow-hidden rounded-[18px] bg-white">

          <SettingSwitchItem
            icon="bell-outline"
            title="Thông báo đẩy"
            subtitle="Tin tức & ưu đãi khách sạn, điểm đến"
            value={pushNotification}
            onValueChange={setPushNotification}
          />

          <SettingSwitchItem
            icon="calendar-clock"
            title="Nhắc nhở lịch trình & Chuyến đi"
            subtitle="Thông báo trước giờ khởi hành 2 giờ"
            value={tripReminder}
            onValueChange={setTripReminder}
          />

          <SettingSwitchItem
            icon="weather-partly-cloudy"
            title="Cập nhật thời tiết điểm đến"
            subtitle="Dự báo mưa bão hoặc nắng đẹp tại VN"
            value={weatherNotification}
            onValueChange={setWeatherNotification}
          />

          <SettingSwitchItem
            icon="map-marker-radius-outline"
            title="Dịch vụ định vị"
            subtitle="Chính xác cao khi du lịch"
            badge="GPS"
            value={locationEnabled}
            onValueChange={setLocationEnabled}
            isLast
          />

        </View>

        {/* ==================== SUPPORT ==================== */}

        <SectionTitle title="HỖ TRỢ & THÔNG TIN" />

        <View className="overflow-hidden rounded-[18px] bg-white">

          <SettingItem
            icon="help-circle-outline"
            title="Trung tâm trợ giúp & FAQ"
            subtitle="Hướng dẫn sử dụng & CSKH 24/7"
            onPress={() =>
              showComingSoon('Trung tâm trợ giúp & FAQ')
            }
          />

          <SettingItem
            icon="file-document-outline"
            title="Điều khoản dịch vụ & Chính sách"
            subtitle="Bảo vệ khách du lịch & bảo mật"
            onPress={() =>
              showComingSoon('Điều khoản & Chính sách')
            }
          />

          <SettingItem
            icon="information-outline"
            title="Phiên bản ứng dụng"
            subtitle="Smart Travel AI Engine"
            value="v2.4.0"
            showArrow={false}
            isLast
          />

        </View>

        {/* ==================== LOGOUT ==================== */}

        <Pressable
          onPress={handleLogout}
          className="mt-5 flex-row items-center rounded-[18px] bg-[#FFE5E5] px-4 py-4"
        >
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#FFD1D1]">
            <MaterialCommunityIcons
              name="logout"
              size={21}
              color="#DF4E50"
            />
          </View>

          <View className="min-w-0 flex-1">
            <Text className="text-[14px] font-bold text-[#C83E43]">
              Đăng xuất khỏi tài khoản
            </Text>

            <Text className="mt-1 text-[10px] text-[#D07579]">
              Lưu lại toàn bộ dữ liệu người dùng
            </Text>
          </View>

          <MaterialCommunityIcons
            name="arrow-right"
            size={21}
            color="#D35358"
          />
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}
