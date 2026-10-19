
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ================ TYPES ================

type IconName =
  React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export type EditableProfile = {
  name: string;
  email: string;
  phone: string;
  city: string;
  preferences: string[];
};

type EditProfileScreenProps = {
  initialProfile?: EditableProfile;
  onBack?: () => void;
  onSave?: (profile: EditableProfile) => void;
};

// ================ COLORS ================

const COLORS = {
  background: '#F8F7FC',
  primary: '#006D68',
  dark: '#123747',
  muted: '#7E8797',
  mint: '#A0F1E7',
  lightPurple: '#EBEDFF',
  white: '#FFFFFF',
};

// ================ MOCK DATA ================

export const defaultProfile: EditableProfile = {
  name: 'Hoàng Nam',
  email: 'hoangnam.travel@gmail.com',
  phone: '912 345 678',
  city: 'TP. Hồ Chí Minh',
  preferences: [
    'Biển đảo',
    'Văn hóa di sản',
    'Ẩm thực địa phương',
  ],
};

const cityOptions = [
  'TP. Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Đà Lạt',
  'Nha Trang',
  'Cần Thơ',
  'Huế',
  'Hải Phòng',
];

const preferenceOptions: {
  label: string;
  icon: IconName;
}[] = [
  {
    label: 'Biển đảo',
    icon: 'waves',
  },
  {
    label: 'Văn hóa di sản',
    icon: 'bank-outline',
  },
  {
    label: 'Ẩm thực địa phương',
    icon: 'food',
  },
  {
    label: 'Trekking & Khám phá',
    icon: 'hiking',
  },
  {
    label: 'Nghỉ dưỡng & Wellness',
    icon: 'spa',
  },
  {
    label: 'Check-in nhiếp ảnh',
    icon: 'camera-outline',
  },
];

// ================ FIELD CARD ================

function FieldCard({
                     label,
                     required = false,
                     right,
                     children,
                   }: {
  label: string;
  required?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-3 rounded-2xl bg-white px-4 py-3.5">
      <View className="flex-row items-center justify-between">
        <Text
          className="text-[13px] font-semibold"
          style={{ color: COLORS.dark }}
        >
          {label}
          {required && (
            <Text style={{ color: '#00A5A0' }}> *</Text>
          )}
        </Text>

        {right}
      </View>

      <View className="mt-2 flex-row items-center">
        {children}
      </View>
    </View>
  );
}

// ================ PREFERENCE CHIP ================

function PreferenceChip({
                          label,
                          icon,
                          selected,
                          onPress,
                        }: {
  label: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      className="flex-row items-center rounded-full px-3 py-2.5"
      style={{
        backgroundColor: selected
          ? COLORS.mint
          : COLORS.lightPurple,
      }}
    >
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color={selected ? '#007A77' : '#4A7091'}
      />

      <Text
        className="ml-1.5 text-[12px] font-semibold"
        style={{
          color: selected ? '#006D68' : '#36546A',
        }}
      >
        {label}
      </Text>

      {selected && (
        <MaterialCommunityIcons
          name="check"
          size={16}
          color="#007F78"
          style={{ marginLeft: 7 }}
        />
      )}
    </Pressable>
  );
}

// ================ MAIN SCREEN ================

export default function EditProfileScreen({
                                            initialProfile = defaultProfile,
                                            onBack,
                                            onSave,
                                          }: EditProfileScreenProps) {
  const [profile, setProfile] =
    useState<EditableProfile>(() => ({
      ...initialProfile,
      preferences: [...initialProfile.preferences],
    }));

  const [cityModalVisible, setCityModalVisible] =
    useState(false);

  const updateField = (
    field: 'name' | 'email' | 'phone' | 'city',
    value: string
  ) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const togglePreference = (value: string) => {
    setProfile((previous) => {
      const exists = previous.preferences.includes(value);

      return {
        ...previous,
        preferences: exists
          ? previous.preferences.filter(
            (item) => item !== value
          )
          : [...previous.preferences, value],
      };
    });
  };

  const handleChangeAvatar = () => {
    Alert.alert(
      'Thay đổi ảnh đại diện',
      'Chức năng chọn ảnh sẽ được bổ sung sau. Hiện tại ứng dụng đang dùng dữ liệu hardcode.'
    );
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      Alert.alert(
        'Hủy bỏ',
        'Chưa kết nối màn hình quay lại.'
      );
    }
  };

  const handleSave = () => {
    const name = profile.name.trim();
    const email = profile.email.trim();

    if (!name) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập họ và tên.'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert(
        'Email không hợp lệ',
        'Vui lòng kiểm tra lại địa chỉ email.'
      );
      return;
    }

    const updatedProfile: EditableProfile = {
      ...profile,
      name,
      email,
    };

    if (onSave) {
      onSave(updatedProfile);
    } else {
      Alert.alert(
        'Đã lưu thay đổi',
        'Thông tin đã được cập nhật trong giao diện demo.'
      );
    }
  };

  const emailVerified =
    profile.email.trim().toLowerCase() ===
    initialProfile.email.trim().toLowerCase();

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{
        backgroundColor: COLORS.background,
      }}
    >
      <StatusBar style="dark" />

      {/* ================ HEADER ================ */}

      <View className="h-[58px] flex-row items-center justify-between border-b border-[#F0EFF6] bg-[#FCFBFF] px-4">
        <View className="flex-row items-center">
          <Pressable
            onPress={handleBack}
            accessibilityLabel="Quay lại"
            className="mr-3 h-10 w-9 items-center justify-center"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#435369"
            />
          </Pressable>

          <Text
            className="text-[18px] font-semibold"
            style={{ color: '#27374B' }}
          >
            Chỉnh sửa hồ sơ
          </Text>
        </View>

        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{
            backgroundColor: '#248982',
          }}
        >
          <MaterialCommunityIcons
            name="account-outline"
            size={21}
            color="#FFFFFF"
          />
        </View>
      </View>

      {/* ================ FORM ================ */}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 28,
          }}
        >
          {/* ================ AVATAR ================ */}

          <View className="items-center pb-5 pt-6">
            <Pressable
              onPress={handleChangeAvatar}
              accessibilityLabel="Thay đổi ảnh đại diện"
              className="relative"
            >
              <View
                className="h-[108px] w-[108px] items-center justify-center rounded-full"
                style={{
                  backgroundColor: '#98F0E7',
                  shadowColor: '#30C9BD',
                  shadowOpacity: 0.2,
                  shadowRadius: 18,
                  elevation: 6,
                }}
              >
                <MaterialCommunityIcons
                  name="account-outline"
                  size={66}
                  color="#006D72"
                />
              </View>

              <View
                className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full border-[3px] border-[#F8F7FC]"
                style={{
                  backgroundColor: '#006A65',
                }}
              >
                <MaterialCommunityIcons
                  name="camera-outline"
                  size={21}
                  color="#FFFFFF"
                />
              </View>
            </Pressable>

            <Text
              className="mt-4 text-center text-[12px] font-medium"
              style={{ color: '#526179' }}
            >
              Nhấn để thay đổi ảnh đại diện
            </Text>

            <Text
              className="text-center text-[11px]"
              style={{ color: '#8793AB' }}
            >
              (Tối đa 5MB, JPG/PNG)
            </Text>
          </View>

          {/* ================ FULL NAME ================ */}

          <FieldCard label="Họ và tên" required>
            <MaterialCommunityIcons
              name="account-outline"
              size={21}
              color="#007A78"
            />

            <TextInput
              className="ml-2 flex-1 p-0 text-[16px] font-semibold"
              style={{ color: COLORS.dark }}
              value={profile.name}
              onChangeText={(value) =>
                updateField('name', value)
              }
              placeholder="Nhập họ và tên"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              returnKeyType="next"
            />
          </FieldCard>

          {/* ================ EMAIL ================ */}

          <FieldCard
            label="Địa chỉ Email"
            right={
              emailVerified ? (
                <View className="flex-row items-center rounded-full bg-[#B5F4EA] px-2.5 py-1">
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={13}
                    color="#00766F"
                  />

                  <Text className="ml-1 text-[10px] font-bold text-[#00766F]">
                    Đã xác minh
                  </Text>
                </View>
              ) : (
                <Text className="text-[10px] text-[#8B94A5]">
                  Chưa xác minh
                </Text>
              )
            }
          >
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color="#007A78"
            />

            <TextInput
              className="ml-2 flex-1 p-0 text-[15px] font-medium"
              style={{ color: COLORS.dark }}
              value={profile.email}
              onChangeText={(value) =>
                updateField('email', value)
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Nhập địa chỉ email"
              placeholderTextColor="#9CA3AF"
            />
          </FieldCard>

          {/* ================ PHONE NUMBER ================ */}

          <FieldCard label="Số điện thoại">
            <View className="mr-3 rounded-lg bg-[#EDF0FF] px-2.5 py-2">
              <Text className="text-[12px] font-bold text-[#405A82]">
                VN +84
              </Text>
            </View>

            <TextInput
              className="flex-1 p-0 text-[16px] font-semibold"
              style={{ color: COLORS.dark }}
              value={profile.phone}
              onChangeText={(value) =>
                updateField('phone', value)
              }
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </FieldCard>

          {/* ================ CITY ================ */}

          <FieldCard label="Thành phố cư trú">
            <Pressable
              onPress={() => setCityModalVisible(true)}
              className="flex-1 flex-row items-center"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={22}
                color="#007A78"
              />

              <Text
                className="ml-2 flex-1 text-[16px] font-semibold"
                style={{ color: COLORS.dark }}
              >
                {profile.city}
              </Text>

              <MaterialCommunityIcons
                name="unfold-more-horizontal"
                size={21}
                color="#A4ADC1"
              />
            </Pressable>
          </FieldCard>

          {/* ================ TRAVEL PREFERENCES ================ */}

          <View className="mt-1 rounded-2xl bg-white px-4 py-4">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name="compass-outline"
                  size={20}
                  color="#C68B16"
                />

                <Text
                  className="ml-2 text-[14px] font-bold"
                  style={{ color: COLORS.dark }}
                >
                  Sở thích du lịch yêu thích
                </Text>
              </View>

              <Text className="text-[11px] font-medium text-[#77859A]">
                {profile.preferences.length}/6 đã chọn
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {preferenceOptions.map((item) => (
                <PreferenceChip
                  key={item.label}
                  label={item.label}
                  icon={item.icon}
                  selected={profile.preferences.includes(
                    item.label
                  )}
                  onPress={() =>
                    togglePreference(item.label)
                  }
                />
              ))}
            </View>
          </View>

          {/* ================ AI INFORMATION ================ */}

          <LinearGradient
            colors={['#D6FAF6', '#E7E9FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#9EF1E7]">
              <MaterialCommunityIcons
                name="auto-fix"
                size={22}
                color="#007A78"
              />
            </View>

            <Text
              className="flex-1 text-[12px] leading-[18px]"
              style={{
                color: '#526C83',
              }}
            >
              Thông tin hồ sơ giúp AI thiết kế lộ trình
              cá nhân hóa chính xác hơn theo phong cách
              của bạn.
            </Text>
          </LinearGradient>

          {/* ================ SAVE BUTTON ================ */}

          <Pressable
            onPress={handleSave}
            className="mt-5 h-[53px] flex-row items-center justify-center rounded-full bg-[#006C64] active:opacity-80"
            style={{
              elevation: 3,
            }}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={23}
              color="#FFFFFF"
            />

            <Text className="ml-2 text-[16px] font-bold text-white">
              Lưu thay đổi
            </Text>
          </Pressable>

          {/* ================ CANCEL BUTTON ================ */}

          <Pressable
            onPress={handleBack}
            className="mt-3 h-[48px] items-center justify-center rounded-full bg-[#E9EBFF] active:opacity-80"
          >
            <Text
              className="text-[15px] font-semibold"
              style={{ color: '#334E68' }}
            >
              Hủy bỏ
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ================ CITY SELECTION MODAL ================ */}

      <Modal
        visible={cityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setCityModalVisible(false)
        }
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full overflow-hidden rounded-3xl bg-white p-5">
            <Text className="mb-4 text-center text-[17px] font-bold text-[#123747]">
              Chọn thành phố cư trú
            </Text>

            <ScrollView
              style={{ maxHeight: 360 }}
              showsVerticalScrollIndicator={false}
            >
              {cityOptions.map((city) => {
                const selected = profile.city === city;

                return (
                  <Pressable
                    key={city}
                    onPress={() => {
                      updateField('city', city);
                      setCityModalVisible(false);
                    }}
                    className="flex-row items-center justify-between border-b border-[#F1F2F7] py-3.5"
                  >
                    <Text
                      className="text-[14px]"
                      style={{
                        color: selected
                          ? '#00766F'
                          : '#35465B',
                        fontWeight: selected
                          ? '700'
                          : '500',
                      }}
                    >
                      {city}
                    </Text>

                    {selected && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={19}
                        color="#00867E"
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={() =>
                setCityModalVisible(false)
              }
              className="mt-4 items-center rounded-xl bg-[#E9EBFF] py-3"
            >
              <Text className="font-semibold text-[#465A75]">
                Đóng
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
