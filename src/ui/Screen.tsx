import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Typography';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Icon } from './Icon';

/** Khung màn hình: nền, vùng an toàn, cuộn (tuỳ chọn), kéo để tải lại */
export function Screen({
  children,
  scroll = true,
  header,
  footer,
  edges = ['top'],
  refreshing,
  onRefresh,
  contentStyle,
  background = colors.bg,
}: {
  children: ReactNode;
  scroll?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  edges?: Edge[];
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  background?: string;
}) {
  // Android vẽ tràn xuống vùng thanh điều hướng (3 nút / thanh vuốt): chừa đúng khoảng đó ở chân
  // màn hình để nút và chữ không bị đè.
  const insets = useSafeAreaInsets();
  const bottomInset = edges.includes('bottom') ? 0 : insets.bottom;
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {header}
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              { padding: 16, paddingBottom: 32 + (footer ? 0 : bottomInset) },
              contentStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={Boolean(refreshing)}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1, paddingBottom: footer ? 0 : bottomInset }, contentStyle]}>{children}</View>
        )}
        {footer ? <View style={{ backgroundColor: '#FFFFFF', paddingBottom: bottomInset }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Thanh tiêu đề có nút quay lại (giống PageBar của web) */
export function Header({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-2 border-b border-[#E5F1F4] bg-white px-3 py-2.5">
      {onBack && (
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          className="h-10 w-10 items-center justify-center rounded-full bg-[#F1F8FA]"
        >
          <Icon name="arrow-back" size={22} />
        </Pressable>
      )}
      <View className="min-w-0 flex-1 px-1">
        <Text numberOfLines={1} className="text-[17px] font-extrabold text-[#0F2A3B]">
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} className="text-[12px] text-[#557080]">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Tiêu đề một khu trong trang */
export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <View className="mb-3 flex-row items-end justify-between gap-3">
      <View className="min-w-0 flex-1">
        {eyebrow ? (
          <Text className="text-[10px] font-extrabold uppercase tracking-[1.6px] text-[#0891B2]">
            {eyebrow}
          </Text>
        ) : null}
        <Text className="mt-0.5 text-[19px] font-extrabold text-[#0F2A3B]">{title}</Text>
      </View>
      {action}
    </View>
  );
}
