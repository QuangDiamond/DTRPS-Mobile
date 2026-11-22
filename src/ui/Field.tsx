import { useState } from 'react';
import { Pressable, View, type KeyboardTypeOptions } from 'react-native';
import { Text, TextInput } from './Typography';
import { colors } from '../theme';
import { Icon, type IconName } from './Icon';

/** Ô nhập có nhãn, lỗi và gợi ý — bản mobile của client/ui/Field.tsx */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  keyboardType = 'default',
  error,
  hint,
  icon,
  multiline = false,
  maxLength,
  editable = true,
  autoCapitalize = 'sentences',
  autoComplete,
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string | null;
  hint?: string;
  icon?: IconName;
  multiline?: boolean;
  maxLength?: number;
  editable?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'new-password' | 'name' | 'tel' | 'off';
}) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View className="mb-4">
      {label ? (
        <Text className="mb-1.5 text-[12.5px] font-bold text-[#24404F]">{label}</Text>
      ) : null}
      <View
        style={{
          minHeight: multiline ? 96 : 50,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: error ? colors.danger : focused ? colors.primary : colors.line,
          backgroundColor: editable ? colors.field : '#EEF3F5',
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 0,
        }}
      >
        {icon ? <Icon name={icon} size={19} color={colors.muted} style={{ marginRight: 8 }} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#93A7B1"
          secureTextEntry={secure && !visible}
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
          editable={editable}
          autoCapitalize={secure || keyboardType === 'email-address' ? 'none' : autoCapitalize}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            fontSize: 14,
            color: colors.ink,
            minHeight: multiline ? 76 : 48,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
        {secure ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            <Icon name={visible ? 'visibility-off' : 'visibility'} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text className="mt-1 text-[11.5px] text-[#D83A48]">{error}</Text>
      ) : hint ? (
        <Text className="mt-1 text-[11.5px] text-[#6B8592]">{hint}</Text>
      ) : null}
      {maxLength && multiline ? (
        <Text className="mt-1 self-end text-[10.5px] text-[#93A7B1]">
          {value.length}/{maxLength}
        </Text>
      ) : null}
    </View>
  );
}
