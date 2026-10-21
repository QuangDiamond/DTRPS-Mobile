
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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

// ==================== TYPES ====================

type IconName =
  React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type ChangePasswordScreenProps = {
  onBack?: () => void;
  onForgotPasswordPress?: () => void;
  onSubmit?: (
    currentPassword: string,
    newPassword: string
  ) => void;
};

// ==================== COLORS ====================

const COLORS = {
  background: '#FAF8FF',
  primary: '#006D68',
  primaryDark: '#005F5B',
  title: '#16394D',
  muted: '#6D8297',
  lightPurple: '#F0F1FF',
  white: '#FFFFFF',
};

// ==================== PASSWORD FIELD ====================

type PasswordFieldProps = {
  icon: IconName;
  value: string;
  onChangeText: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
  placeholder: string;
};

function PasswordField({
                         icon,
                         value,
                         onChangeText,
                         visible,
                         onToggleVisibility,
                         placeholder,
                       }: PasswordFieldProps) {
  return (
    <View className="h-[58px] flex-row items-center rounded-2xl bg-white px-4">
      <MaterialCommunityIcons
        name={icon}
        size={21}
        color={COLORS.primary}
      />

      <TextInput
        className="ml-3 flex-1 p-0 text-[15px] font-medium"
        style={{ color: COLORS.title }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A7B2C1"
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        selectionColor={COLORS.primary}
      />

      <Pressable
        onPress={onToggleVisibility}
        accessibilityRole="button"
        accessibilityLabel={
          visible ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'
        }
        className="ml-2 h-10 w-10 items-center justify-center"
      >
        <MaterialCommunityIcons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color="#35556B"
        />
      </Pressable>
    </View>
  );
}

// ==================== PASSWORD RULE ====================

function PasswordRule({
                        title,
                        valid,
                      }: {
  title: string;
  valid: boolean;
}) {
  return (
    <View className="mb-2 flex-row items-center">
      <MaterialCommunityIcons
        name={
          valid
            ? 'check-circle'
            : 'checkbox-blank-circle-outline'
        }
        size={18}
        color={valid ? '#007A73' : '#A1ADBD'}
      />

      <Text
        className="ml-2 text-[12px]"
        style={{
          color: valid ? '#164B58' : '#8190A3',
          fontWeight: valid ? '500' : '400',
        }}
      >
        {title}
      </Text>
    </View>
  );
}

// ==================== MAIN SCREEN ====================


export default function ProfileChangePasswordScreen({
                                                      onBack,
                                                      onForgotPasswordPress,
                                                      onSubmit,
                                                    }: ChangePasswordScreenProps) {

  // ==================== FORM STATE ====================

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ==================== VALIDATION ====================

  const passwordRules = [
    {
      title: 'Tối thiểu 8 ký tự',
      valid: newPassword.length >= 8,
    },
    {
      title: 'Có ít nhất 1 chữ in hoa (A-Z)',
      valid: /[A-Z]/.test(newPassword),
    },
    {
      title: 'Có ít nhất 1 số (0-9)',
      valid: /[0-9]/.test(newPassword),
    },
    {
      title: 'Có ký tự đặc biệt (@, #, $, ...)',
      valid: /[^A-Za-z0-9]/.test(newPassword),
    },
  ];

  const hasLowercase = /[a-z]/.test(newPassword);

  const completedRules = passwordRules.filter(
    (rule) => rule.valid
  ).length;

  const strengthScore = hasLowercase
    ? completedRules
    : Math.min(completedRules, 3);

  const isStrong =
    completedRules === 4 && hasLowercase;

  const passwordsMatch =
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const strengthLabel =
    newPassword.length === 0
      ? 'Chưa nhập'
      : strengthScore <= 1
        ? 'Yếu (Weak)'
        : strengthScore <= 3
          ? 'Trung bình (Medium)'
          : 'Khá mạnh (Strong)';

  const strengthColor =
    strengthScore <= 1
      ? '#E87575'
      : strengthScore <= 3
        ? '#D69E36'
        : '#007A73';

  // ==================== HANDLERS ====================

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      Alert.alert(
        'Quay lại',
        'Chưa kết nối màn hình trước.'
      );
    }
  };

  const handleForgotPassword = () => {
    if (onForgotPasswordPress) {
      onForgotPasswordPress();
    } else {
      Alert.alert(
        'Quên mật khẩu?',
        'Màn hình quên mật khẩu sẽ được tích hợp sau.'
      );
    }
  };

  const handleSave = () => {
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập đầy đủ các trường mật khẩu.'
      );
      return;
    }

    if (!isStrong) {
      Alert.alert(
        'Mật khẩu chưa đủ mạnh',
        'Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.'
      );
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        'Mật khẩu không hợp lệ',
        'Mật khẩu mới phải khác mật khẩu hiện tại.'
      );
      return;
    }

    if (!passwordsMatch) {
      Alert.alert(
        'Mật khẩu không trùng khớp',
        'Vui lòng xác nhận lại mật khẩu mới.'
      );
      return;
    }

    // Dành cho tích hợp API sau này
    if (onSubmit) {
      onSubmit(currentPassword, newPassword);
      return;
    }

    // Demo Frontend: không đổi mật khẩu thật
    Alert.alert(
      'Kiểm tra thành công',
      'Mật khẩu mới đã đáp ứng các điều kiện. Đây là bản demo giao diện, chưa cập nhật mật khẩu tài khoản.',
      [
        {
          text: 'OK',
          onPress: handleBack,
        },
      ]
    );
  };

  // ==================== UI ====================

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{ backgroundColor: COLORS.background }}
    >
      <StatusBar style="dark" />

      {/* ==================== HEADER ==================== */}

      <View className="h-[62px] flex-row items-center justify-between border-b border-[#EFEFF6] bg-white px-4">
        <View className="flex-row items-center">
          <Pressable
            onPress={handleBack}
            accessibilityLabel="Quay lại"
            className="mr-3 h-10 w-10 items-center justify-center"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={25}
              color="#3B536A"
            />
          </Pressable>

          <View>
            <Text className="text-[17px] font-extrabold text-[#146E6A]">
              SmartTravel
            </Text>
            <Text className="text-[10px] text-[#7B899B]">
              Đổi mật khẩu
            </Text>
          </View>
        </View>

        <View className="h-9 w-9 items-center justify-center rounded-full bg-[#007C75]">
          <MaterialCommunityIcons
            name="account-outline"
            size={22}
            color="white"
          />
        </View>
      </View>

      {/* ==================== CONTENT ==================== */}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={
          Platform.OS === 'ios' ? 'padding' : undefined
        }
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: 30,
          }}
        >
          {/* ==================== SECURITY CARD ==================== */}

          <LinearGradient
            colors={['#F0F1FF', '#DFF8FC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 17,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'flex-start',
              minHeight: 124,
            }}
          >
            <View
              className="mr-3 h-[52px] w-[52px] items-center justify-center rounded-xl"
              style={{
                backgroundColor: COLORS.primary,
                elevation: 3,
              }}
            >
              <MaterialCommunityIcons
                name="shield-lock"
                size={28}
                color="#FFFFFF"
              />
            </View>

            <View className="min-w-0 flex-1">
              <Text
                className="text-[17px] font-bold"
                style={{ color: COLORS.title }}
              >
                Bảo vệ tài khoản của bạn
              </Text>

              <Text
                className="mt-2 text-[12px] leading-[19px]"
                style={{ color: '#52728A' }}
              >
                Mật khẩu mới phải có tối thiểu 8 ký tự,
                bao gồm chữ hoa, chữ thường, số và ký tự
                đặc biệt để bảo vệ chuyến đi và thông tin
                cá nhân.
              </Text>
            </View>
          </LinearGradient>

          {/* ==================== CURRENT PASSWORD ==================== */}

          <View className="mt-7">
            <View className="mb-2 flex-row items-center justify-between">
              <Text
                className="text-[14px] font-bold"
                style={{ color: COLORS.title }}
              >
                Mật khẩu hiện tại
              </Text>

              <Pressable onPress={handleForgotPassword}>
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: COLORS.primary }}
                >
                  Quên mật khẩu?
                </Text>
              </Pressable>
            </View>

            <PasswordField
              icon="lock-outline"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              visible={showCurrent}
              onToggleVisibility={() =>
                setShowCurrent((previous) => !previous)
              }
              placeholder="Nhập mật khẩu hiện tại"
            />
          </View>

          {/* ==================== NEW PASSWORD ==================== */}

          <View className="mt-6">
            <Text
              className="mb-2 text-[14px] font-bold"
              style={{ color: COLORS.title }}
            >
              Mật khẩu mới
            </Text>

            <PasswordField
              icon="key-outline"
              value={newPassword}
              onChangeText={setNewPassword}
              visible={showNew}
              onToggleVisibility={() =>
                setShowNew((previous) => !previous)
              }
              placeholder="Nhập mật khẩu mới"
            />
          </View>

          {/* ==================== PASSWORD STRENGTH ==================== */}

          <View className="mt-3 rounded-2xl bg-[#F0F1FF] px-4 py-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] font-medium text-[#54718A]">
                Độ an toàn:
              </Text>

              <Text
                className="text-[11px] font-bold"
                style={{
                  color:
                    newPassword.length > 0
                      ? strengthColor
                      : '#8C9AB0',
                }}
              >
                ● {strengthLabel}
              </Text>
            </View>

            {/* Strength Bars */}

            <View className="mb-4 mt-3 flex-row gap-1.5">
              {[1, 2, 3, 4].map((level) => (
                <View
                  key={level}
                  className="h-[6px] flex-1 rounded-full"
                  style={{
                    backgroundColor:
                      strengthScore >= level
                        ? strengthColor
                        : '#DCE2FA',
                  }}
                />
              ))}
            </View>

            {/* Validation Rules */}

            {passwordRules.map((rule) => (
              <PasswordRule
                key={rule.title}
                title={rule.title}
                valid={rule.valid}
              />
            ))}
          </View>

          {/* ==================== CONFIRM PASSWORD ==================== */}

          <View className="mt-7">
            <Text
              className="mb-2 text-[14px] font-bold"
              style={{ color: COLORS.title }}
            >
              Xác nhận mật khẩu mới
            </Text>

            <PasswordField
              icon="lock-check-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              visible={showConfirm}
              onToggleVisibility={() =>
                setShowConfirm((previous) => !previous)
              }
              placeholder="Nhập lại mật khẩu mới"
            />

            {confirmPassword.length > 0 && (
              <View className="mt-3 flex-row items-center">
                <MaterialCommunityIcons
                  name={
                    passwordsMatch
                      ? 'check-decagram'
                      : 'alert-circle-outline'
                  }
                  size={17}
                  color={
                    passwordsMatch
                      ? '#007A73'
                      : '#D94A4A'
                  }
                />

                <Text
                  className="ml-2 text-[12px] font-medium"
                  style={{
                    color: passwordsMatch
                      ? '#007A73'
                      : '#D94A4A',
                  }}
                >
                  {passwordsMatch
                    ? 'Mật khẩu trùng khớp hoàn toàn'
                    : 'Mật khẩu xác nhận chưa trùng khớp'}
                </Text>
              </View>
            )}
          </View>

          {/* ==================== SAVE ==================== */}

          <Pressable
            onPress={handleSave}
            accessibilityRole="button"
            className="mt-9 h-[54px] flex-row items-center justify-center rounded-full active:opacity-80"
            style={{
              backgroundColor: COLORS.primary,
              elevation: 4,
            }}
          >
            <MaterialCommunityIcons
              name="check"
              size={24}
              color="#FFFFFF"
            />

            <Text className="ml-2 text-[16px] font-bold text-white">
              Lưu mật khẩu mới
            </Text>
          </Pressable>

          {/* ==================== CANCEL ==================== */}

          <Pressable
            onPress={handleBack}
            className="mt-4 h-[43px] items-center justify-center"
          >
            <Text
              className="text-[14px] font-semibold"
              style={{ color: COLORS.title }}
            >
              Hủy thay đổi
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
