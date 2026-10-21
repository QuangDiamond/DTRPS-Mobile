import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardTypeOptions,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
export function Brand({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <View className="items-center mb-7">
      <View className="h-16 w-16 bg-[#00998E] rounded-2xl items-center justify-center mb-3">
        <Icon name="web" color="white" size={38} />
      </View>
      <Text className="text-[26px] font-extrabold text-[#102235]">
        Smart<Text className="text-[#009D91]">Travel</Text>
      </Text>
      {subtitle && (
        <Text className="text-[10px] font-extrabold tracking-[1.5px] text-[#008B85]">
          VIETNAM AI TRAVEL PLANNER
        </Text>
      )}
    </View>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  keyboardType = 'default',
  error,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-[12px] font-bold text-[#293E4A] mb-1.5">{label}</Text>
      <View
        className={`h-[51px] flex-row items-center rounded-xl border px-3 bg-[#F6F7FC] ${error ? 'border-red-400' : 'border-[#EBEDF5]'}`}
      >
        <Icon
          name={
            secure
              ? 'lock-outline'
              : keyboardType === 'email-address'
                ? 'email-outline'
                : 'account-outline'
          }
          size={18}
          color="#168C85"
        />
        <TextInput
          className="flex-1 ml-2 text-[14px] text-[#18333E]"
          placeholder={placeholder}
          placeholderTextColor="#98A4AF"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !visible}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {secure && (
          <Pressable
            accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onPress={() => setVisible(!visible)}
          >
            <Icon name={visible ? 'eye-outline' : 'eye-off-outline'} size={20} color="#83959E" />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text className="text-red-600 text-xs mt-1">{error}</Text>
      ) : hint ? (
        <Text className="text-[11px] text-[#71838D] mt-1">{hint}</Text>
      ) : null}
    </View>
  );
}
export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      className={`h-[50px] rounded-2xl items-center justify-center flex-row ${disabled ? 'bg-[#9EBEB9]' : 'bg-[#006B62]'}`}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          <Text className="text-white font-extrabold text-[14px]">{title}</Text>
          <Icon name="arrow-right" color="white" size={19} style={{ marginLeft: 8 }} />
        </>
      )}
    </Pressable>
  );
}
export function LinkText({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="py-3 items-center">
      <Text className="text-[#007A73] font-bold text-[12px]">{title}</Text>
    </Pressable>
  );
}
export const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
export const validPassword = (s: string) =>
  s.length >= 8 && /[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s);
