import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Typography';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

const VARIANT: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, fg: '#FFFFFF' },
  secondary: { bg: colors.primarySoft, fg: colors.primaryStrong },
  outline: { bg: '#FFFFFF', fg: colors.primaryStrong, border: colors.line },
  ghost: { bg: 'transparent', fg: colors.primaryStrong },
  danger: { bg: colors.danger, fg: '#FFFFFF' },
};

/**
 * Trạng thái đang bấm giữ bằng state: NativeWind bỏ qua style dạng hàm `({ pressed }) => …` của
 * Pressable (nút sẽ mất màu nền, chữ trắng trên nền trắng) nên không dùng kiểu đó.
 */
function usePressed() {
  const [pressed, setPressed] = useState(false);
  return {
    pressed,
    handlers: { onPressIn: () => setPressed(true), onPressOut: () => setPressed(false) },
  };
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  size = 'md',
  full = true,
  style,
  children,
}: {
  title?: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** true: rộng hết dòng; false: vừa nội dung */
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const { pressed, handlers } = usePressed();
  const v = VARIANT[variant];
  const height = size === 'sm' ? 38 : size === 'lg' ? 54 : 48;
  const fontSize = size === 'sm' ? 12.5 : size === 'lg' ? 15 : 14;
  const inactive = disabled || loading;
  const background = inactive && variant === 'primary' && !loading ? '#A9D9E5' : v.bg;
  return (
    <Pressable
      onPress={onPress}
      {...handlers}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: background,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          paddingHorizontal: size === 'sm' ? 14 : 20,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: pressed ? 0.85 : inactive && variant !== 'primary' ? 0.55 : 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {loading ? (
          <ActivityIndicator size="small" color={v.fg} />
        ) : icon ? (
          <Icon name={icon} size={fontSize + 5} color={v.fg} />
        ) : null}
        {title ? (
          <Text style={{ color: v.fg, fontSize, fontWeight: '800' }} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {children}
        {iconRight && !loading ? <Icon name={iconRight} size={fontSize + 5} color={v.fg} /> : null}
      </View>
    </Pressable>
  );
}

/** Nút tròn chỉ có icon */
export function IconButton({
  icon,
  onPress,
  label,
  color = colors.ink,
  background = '#F1F8FA',
  size = 40,
  disabled,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  color?: string;
  background?: string;
  size?: number;
  disabled?: boolean;
}) {
  const { pressed, handlers } = usePressed();
  return (
    <Pressable
      onPress={onPress}
      {...handlers}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
      }}
    >
      <Icon name={icon} size={Math.round(size * 0.52)} color={color} />
    </Pressable>
  );
}

export { usePressed };
