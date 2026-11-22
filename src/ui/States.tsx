import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from './Typography';
import { colors } from '../theme';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

export function Loading({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <View className="items-center justify-center py-10" accessibilityRole="progressbar">
      <ActivityIndicator color={colors.primary} />
      <Text className="mt-2 text-[12.5px] text-[#557080]">{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="items-center rounded-2xl border border-[#F6D5D8] bg-[#FDEEEF] px-5 py-6">
      <Icon name="error-outline" size={30} color={colors.danger} />
      <Text className="mt-2 text-center text-[13px] text-[#8E2630]">{message}</Text>
      {onRetry ? (
        <Button title="Thử lại" variant="outline" size="sm" full={false} onPress={onRetry} style={{ marginTop: 12 }} />
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = 'travel-explore',
  title,
  message,
  action,
}: {
  icon?: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <View className="items-center rounded-2xl bg-white px-5 py-9">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-[#ECFEFF]">
        <Icon name={icon} size={28} color={colors.primary} />
      </View>
      <Text className="mt-3 text-center text-[15px] font-extrabold text-[#0F2A3B]">{title}</Text>
      {message ? (
        <Text className="mt-1 text-center text-[12.5px] leading-5 text-[#557080]">{message}</Text>
      ) : null}
      {action ? <View className="mt-4 self-stretch">{action}</View> : null}
    </View>
  );
}

const TONES = {
  info: { bg: '#ECFEFF', border: '#BDEFF7', fg: '#0E7490', icon: 'info-outline' as IconName },
  success: { bg: '#E6F7F0', border: '#BFE8D6', fg: '#13704F', icon: 'check-circle-outline' as IconName },
  warning: { bg: '#FFF7E6', border: '#F7DDA8', fg: '#8A5300', icon: 'warning-amber' as IconName },
  danger: { bg: '#FDEEEF', border: '#F6D5D8', fg: '#A12530', icon: 'error-outline' as IconName },
};

/** Hộp thông báo nhỏ (giống Notice / FormAlert của web) */
export function Notice({
  tone = 'info',
  children,
  title,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
  title?: string;
}) {
  const t = TONES[tone];
  return (
    <View
      style={{ backgroundColor: t.bg, borderColor: t.border }}
      className="mb-3 flex-row gap-2 rounded-xl border p-3"
    >
      <Icon name={t.icon} size={18} color={t.fg} style={{ marginTop: 1 }} />
      <View className="min-w-0 flex-1">
        {title ? <Text style={{ color: t.fg }} className="text-[13px] font-extrabold">{title}</Text> : null}
        {typeof children === 'string' ? (
          <Text style={{ color: t.fg }} className="text-[12.5px] leading-5">
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}
