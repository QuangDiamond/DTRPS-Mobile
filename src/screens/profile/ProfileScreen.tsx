
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomTabBar, {
  type AppTab,
} from '../../components/BottomTabBar';
import AppLogo from '../../components/AppLogo';

// ==================== TYPES ====================

type IconName =
  React.ComponentProps<typeof MaterialCommunityIcons>['name'];


type ProfileScreenProps = {
  onEditProfilePress?: () => void;
  onSettingsPress?: () => void;
  onChangePasswordPress?: () => void;
  onTabPress?: (tab: AppTab) => void;
  profileName?: string;
  profileEmail?: string;
};



// ==================== COLORS ====================

const COLORS = {
  primary: '#087A78',
  primaryDark: '#075C66',
  text: '#13364A',
  muted: '#72818C',
  background: '#F8F8FF',
  mint: '#C3F8F0',
  white: '#FFFFFF',
};

// ==================== MOCK DATA ====================

const user = {
  name: 'Hoàng Nam',
  email: 'hoangnam.travel@gmail.com',
  level: 'Hạng Vàng · Vietnam Explorer',
  trips: 8,
  savedPlaces: 18,
  provinces: 12,
  progress: 45,
};

// ==================== ICON COMPONENT ====================

function IconCircle({
                      name,
                      color = COLORS.primary,
                      backgroundColor = COLORS.mint,
                      size = 21,
                    }: {
  name: IconName;
  color?: string;
  backgroundColor?: string;
  size?: number;
}) {
  return (
    <View
      className="h-11 w-11 items-center justify-center rounded-2xl"
      style={{ backgroundColor }}
    >
      <MaterialCommunityIcons
        name={name}
        size={size}
        color={color}
      />
    </View>
  );
}

// ==================== MENU ITEM ====================

type MenuItemProps = {
  title: string;
  subtitle: string;
  icon: IconName;
  badge?: string;
  badgeColor?: 'mint' | 'gray' | 'red' | 'plain';
  danger?: boolean;
  onPress: () => void;
};

function MenuItem({
                    title,
                    subtitle,
                    icon,
                    badge,
                    badgeColor = 'gray',
                    danger = false,
                    onPress,
                  }: MenuItemProps) {
  const badgeStyle = {
    mint: {
      backgroundColor: '#BEF9F0',
      color: '#006A6F',
    },
    gray: {
      backgroundColor: '#EFF0FB',
      color: '#445577',
    },
    red: {
      backgroundColor: '#FFE0DD',
      color: '#C63E32',
    },
    plain: {
      backgroundColor: 'transparent',
      color: '#13756C',
    },
  }[badgeColor];

  return (
    <Pressable
      onPress={onPress}
      className="min-h-[70px] flex-row items-center px-4 py-3 active:opacity-70"
      accessibilityRole="button"
    >
      <IconCircle
        name={icon}
        color={danger ? '#D94848' : COLORS.primary}
        backgroundColor={
          danger ? '#FFE1DE' : '#C3F7F1'
        }
      />

      <View className="ml-3 min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="text-[15px] font-bold"
          style={{
            color: danger ? '#D32C35' : COLORS.text,
          }}
        >
          {title}
        </Text>

        <Text
          numberOfLines={1}
          className="mt-1 text-[11px]"
          style={{
            color: danger ? '#DB6060' : COLORS.muted,
          }}
        >
          {subtitle}
        </Text>
      </View>

      {badge && (
        <View
          className="ml-1 rounded-full px-2.5 py-1"
          style={{
            backgroundColor: badgeStyle.backgroundColor,
          }}
        >
          <Text
            className="text-[11px] font-bold"
            style={{ color: badgeStyle.color }}
          >
            {badge}
          </Text>
        </View>
      )}

      <MaterialCommunityIcons
        name={danger ? 'arrow-right' : 'chevron-right'}
        size={22}
        color={danger ? '#E36A66' : '#7D9AA9'}
        style={{ marginLeft: 5 }}
      />
    </Pressable>
  );
}

// ==================== SECTION TITLE ====================

function SectionTitle({
                        title,
                      }: {
  title: string;
}) {
  return (
    <Text
      className="mb-2 mt-6 px-1 text-[12px] font-extrabold"
      style={{ color: COLORS.primaryDark }}
    >
      {title}
    </Text>
  );
}

// ==================== MAIN SCREEN ====================




export default function ProfileScreen({
                                        onEditProfilePress,
                                        onSettingsPress,
                                        onChangePasswordPress,
                                        onTabPress,
                                        profileName,
                                        profileEmail,
                                      }: ProfileScreenProps) {




  const showComingSoon = (title: string) => {
    Alert.alert(
      title,
      'Chức năng đang được phát triển.'
    );
  };

  const handleEditProfile = () => {
    if (onEditProfilePress) {
      onEditProfilePress();
    } else {
      showComingSoon('Chỉnh sửa hồ sơ');
    }
  };


  const handleChangePassword = () => {
    if (onChangePasswordPress) {
      onChangePasswordPress();
    } else {
      showComingSoon('Đổi mật khẩu');
    }
  };


  const handleTabPress = (tab: AppTab) => {
    if (tab === 'profile') return;

    if (onTabPress) {
      onTabPress(tab);
    } else {
      showComingSoon('Điều hướng');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
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
      style={{ backgroundColor: COLORS.background }}
    >

      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />

      {/* ================= HEADER ================= */}

      <View className="h-[65px] flex-row items-center justify-between bg-white px-4">

        <AppLogo />

        <View className="flex-row items-center gap-4">

          <Pressable
            onPress={() => showComingSoon('Thông báo')}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={23}
              color="#8C989E"
            />
          </Pressable>

          <Pressable
            onPress={handleEditProfile}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: '#62AAA4' }}
          >
            <MaterialCommunityIcons
              name="account"
              size={22}
              color="white"
            />
          </Pressable>

        </View>

      </View>

      {/* ================= MAIN CONTENT ================= */}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 15,
          paddingTop: 12,
          paddingBottom: 28,
        }}
      >

        {/* ================= USER CARD ================= */}

        <LinearGradient
          colors={['#FFFFFF', '#E2FCF8']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            borderRadius: 22,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >

          {/* Avatar */}

          <View className="mr-4">

            <View
              className="h-[82px] w-[82px] items-center justify-center rounded-full"
              style={{ backgroundColor: '#91F0E5' }}
            >
              <MaterialCommunityIcons
                name="account-circle"
                size={62}
                color="#036C75"
              />
            </View>

            {/* Gold Badge */}

            <View
              className="absolute -right-1 -top-1 h-7 w-7 items-center justify-center rounded-full border-[3px] border-white"
              style={{ backgroundColor: '#BD8300' }}
            >
              <MaterialCommunityIcons
                name="star"
                color="white"
                size={14}
              />
            </View>

            {/* Camera */}

            <Pressable
              onPress={handleEditProfile}
              className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full border-[3px] border-white"
              style={{ backgroundColor: '#00827F' }}
            >
              <MaterialCommunityIcons
                name="camera-outline"
                size={17}
                color="white"
              />
            </Pressable>

          </View>

          {/* User Information */}

          <View className="min-w-0 flex-1">

            <Text
              className="text-[20px] font-extrabold"
              style={{ color: COLORS.text }}
            >
              {profileName ?? user.name}
            </Text>

            <Text
              numberOfLines={1}
              className="mb-2 text-[11px]"
              style={{ color: '#5D7782' }}
            >
              {profileEmail ?? user.email}
            </Text>

            <View
              className="self-start flex-row items-center rounded-full px-2.5 py-1"
              style={{ backgroundColor: '#FFE2C0' }}
            >
              <MaterialCommunityIcons
                name="seal"
                size={13}
                color="#A96200"
              />

              <Text
                numberOfLines={1}
                className="ml-1 text-[10px] font-bold"
                style={{ color: '#864C12' }}
              >
                {user.level}
              </Text>

            </View>

          </View>

        </LinearGradient>

        {/* ================= STATISTICS ================= */}

        <View className="mt-4 flex-row rounded-[20px] bg-white px-3 py-4">

          {[
            {
              value: user.trips,
              label: 'Chuyến đi',
            },
            {
              value: user.savedPlaces,
              label: 'Điểm đã lưu',
            },
            {
              value: user.provinces,
              label: 'Tỉnh thành',
            },
          ].map((item, index) => (

            <View
              key={item.label}
              className="flex-1 items-center justify-center rounded-xl bg-[#F3F4FF] py-2"
              style={{
                marginHorizontal: index === 1 ? 8 : 0,
              }}
            >

              <Text
                className="text-[24px] font-extrabold"
                style={{ color: '#006E78' }}
              >
                {item.value}
              </Text>

              <Text
                className="text-[10px] font-semibold"
                style={{ color: COLORS.text }}
              >
                {item.label}
              </Text>

            </View>

          ))}

        </View>

        {/* ================= EXPLORATION MAP ================= */}

        <View className="mt-4 rounded-[20px] bg-[#F2F3FF] px-4 py-4">

          <View className="flex-row items-center">

            <View
              className="mr-2.5 h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: '#8FEFE3' }}
            >
              <MaterialCommunityIcons
                name="map-search-outline"
                size={21}
                color={COLORS.primary}
              />
            </View>

            <View className="min-w-0 flex-1">

              <Text
                className="text-[16px] font-bold"
                style={{ color: COLORS.text }}
              >
                Bản đồ khám phá
              </Text>

              <Text
                className="text-[11px]"
                style={{ color: '#73838C' }}
              >
                Đạt {user.progress}% dặm đường Việt Nam
              </Text>

            </View>

            <Pressable
              onPress={() =>
                showComingSoon('Huy hiệu khám phá')
              }
              className="flex-row items-center"
            >

              <Text
                className="text-[11px] font-semibold"
                style={{ color: COLORS.primary }}
              >
                Huy hiệu
              </Text>

              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={COLORS.primary}
              />

            </Pressable>

          </View>

          {/* Progress Bar */}

          <View className="mt-3 h-[7px] overflow-hidden rounded-full bg-[#DDE4FF]">

            <View
              className="h-full rounded-full"
              style={{
                backgroundColor: '#00857E',
                width: `${user.progress}%`,
              }}
            />

          </View>

          <View className="mt-1.5 flex-row justify-between">

            <Text
              className="text-[10px] font-semibold"
              style={{ color: '#416A74' }}
            >
              12 / 63 tỉnh thành
            </Text>

            <Text
              className="text-[10px] font-semibold"
              style={{ color: '#416A74' }}
            >
              Còn 3 tỉnh để lên Platinum
            </Text>

          </View>

        </View>

        {/* ================= TRIPS & FAVORITES ================= */}

        <SectionTitle title="HÀNH TRÌNH & YÊU THÍCH" />

        <View className="overflow-hidden rounded-[20px] bg-white">

          <MenuItem
            icon="card-account-details-outline"
            title="Chỉnh sửa hồ sơ"
            subtitle="Cập nhật thông tin cá nhân & ảnh"
            onPress={handleEditProfile}
          />

          <MenuItem
            icon="bag-suitcase-outline"
            title="Chuyến đi của tôi"
            subtitle="Quản lý lịch trình & vé máy bay"
            badge="2 sắp tới"
            badgeColor="mint"
            onPress={() => handleTabPress('trips')}
          />

          <MenuItem
            icon="heart-outline"
            title="Địa điểm yêu thích"
            subtitle="Bộ sưu tập điểm đến & quán ăn"
            badge="18 điểm"
            badgeColor="gray"
            onPress={() => handleTabPress('favorites')}
          />

          <MenuItem
            icon="bell-ring-outline"
            title="Thông báo"
            subtitle="Cập nhật thời tiết & gợi ý hành trình"
            badge="2 mới"
            badgeColor="red"
            onPress={() => showComingSoon('Thông báo')}
          />

        </View>


        {/* ================= SETTINGS ================= */}

        <SectionTitle title="CÀI ĐẶT & TIỆN ÍCH" />

        <View className="overflow-hidden rounded-[20px] bg-white">

          {/* Bảo mật tài khoản - Đổi mật khẩu */}
          <MenuItem
            icon="shield-lock-outline"
            title="Bảo mật tài khoản"
            subtitle="Đổi mật khẩu đăng nhập"
            onPress={handleChangePassword}
          />

          {/* Cài đặt ứng dụng */}
          <MenuItem
            icon="tune-variant"
            title="Cài đặt ứng dụng"
            subtitle="Ngôn ngữ, giao diện, âm thanh"
            onPress={() => onSettingsPress?.()}
          />

          {/* Trợ giúp & Hỗ trợ */}
          <MenuItem
            icon="face-agent"
            title="Trợ giúp & Hỗ trợ"
            subtitle="Tổng đài cứu hộ du lịch 24/7 & FAQ"
            badge="● 24/7"
            badgeColor="plain"
            onPress={() =>
              showComingSoon('Trợ giúp & Hỗ trợ')
            }
          />

        </View>


        {/* ================= LOGOUT ================= */}

        <View className="mt-5 overflow-hidden rounded-[20px] bg-white">

          <MenuItem
            icon="logout"
            title="Đăng xuất"
            subtitle="Đăng xuất khỏi thiết bị này"
            danger
            onPress={handleLogout}
          />

        </View>

        {/* ================= FOOTER ================= */}

        <View className="items-center pb-4 pt-5">

          <Text
            className="text-[11px] font-semibold"
            style={{ color: '#728493' }}
          >
            Smart Travel Vietnam AI • v2.4.0
          </Text>

          <Text
            className="text-center text-[10px]"
            style={{ color: '#63A3B0' }}
          >
            Khám phá Việt Nam theo cách thông minh nhất ✨
          </Text>

        </View>

      </ScrollView>

      {/* ================= BOTTOM NAVIGATION ================= */}

      <BottomTabBar
        activeTab="profile"
        onTabPress={handleTabPress}
      />

    </SafeAreaView>
  );
}
