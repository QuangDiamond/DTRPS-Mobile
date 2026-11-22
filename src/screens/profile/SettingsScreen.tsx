import * as SecureStore from 'expo-secure-store';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Linking, Pressable, Switch, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { siteInfoApi, type SiteInfo } from '../../api/siteInfoApi';
import { useAuth } from '../../auth/AuthProvider';
import type { RootScreenProps } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { Avatar } from '../../ui/Bits';
import { Icon, type IconName } from '../../ui/Icon';
import { Header, Screen } from '../../ui/Screen';

/** Tuỳ chọn chỉ lưu trên máy này (Backend chưa có API cài đặt cho du khách — giống web) */
interface AppSettings {
  pushNotification: boolean;
  tripReminder: boolean;
  weatherNotification: boolean;
  locationEnabled: boolean;
}

const STORAGE_KEY = 'smarttravel.settings';
const DEFAULT_SETTINGS: AppSettings = {
  pushNotification: true,
  tripReminder: true,
  weatherNotification: true,
  locationEnabled: true,
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-5">
      <Text className="mb-2 px-1 text-[11px] font-extrabold tracking-[1.4px] text-[#72818C]">{title}</Text>
      <View style={shadow.card} className="overflow-hidden rounded-3xl bg-white">
        {children}
      </View>
    </View>
  );
}

function Row({
  icon,
  title,
  subtitle,
  right,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} className="min-h-[64px] flex-row items-center gap-3 px-4 py-3">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#ECFEFF]">
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[14px] font-bold text-[#13364A]">{title}</Text>
        {subtitle ? (
          <Text numberOfLines={2} className="text-[12px] text-[#72818C]">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron-right" size={21} color="#A0AEBA" /> : null)}
    </Pressable>
  );
}

/** Cài đặt ứng dụng — giống SettingsPage của web */
export default function SettingsScreen({ navigation }: RootScreenProps<'Settings'>) {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [site, setSite] = useState<SiteInfo | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((raw) => raw && setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) }))
      .catch(() => undefined);
    siteInfoApi.get().then(setSite).catch(() => undefined);
  }, []);

  if (!user) return null;

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  };

  const toggle = (key: keyof AppSettings) => (
    <Switch
      value={settings[key]}
      onValueChange={(value) => update(key, value)}
      trackColor={{ true: colors.primary, false: '#D5D8E0' }}
      thumbColor="#FFFFFF"
    />
  );

  return (
    <Screen header={<Header title="Cài đặt ứng dụng" subtitle="SmartTravel" onBack={() => navigation.goBack()} />}>
      <Pressable
        onPress={() => navigation.navigate('EditProfile')}
        style={shadow.card}
        className="flex-row items-center gap-3 rounded-3xl bg-white p-4"
      >
        <Avatar name={user.name} url={user.avatarUrl} size={48} />
        <View className="min-w-0 flex-1">
          <Text className="text-[15px] font-extrabold text-[#13364A]">{user.name}</Text>
          <Text numberOfLines={1} className="text-[12px] text-[#72818C]">
            {user.email}
          </Text>
        </View>
        <Icon name="edit" size={20} color={colors.primary} />
      </Pressable>

      <Section title="TÙY CHỌN CHUNG">
        <Row icon="translate" title="Ngôn ngữ" subtitle="Tiếng Việt" />
        <Row icon="payments" title="Tiền tệ" subtitle="VND (₫)" />
      </Section>

      <Section title="THÔNG BÁO & ĐỊNH VỊ">
        <Row icon="notifications-active" title="Thông báo đẩy" subtitle="Cập nhật quan trọng về tài khoản" right={toggle('pushNotification')} />
        <Row icon="alarm" title="Nhắc lịch trình" subtitle="Nhắc trước giờ đi mỗi điểm" right={toggle('tripReminder')} />
        <Row icon="thunderstorm" title="Cảnh báo thời tiết" subtitle="Khi thời tiết ảnh hưởng lịch trình" right={toggle('weatherNotification')} />
        <Row icon="my-location" title="Định vị khi đi chuyến" subtitle="Dùng GPS để chỉ đường tới điểm tiếp theo" right={toggle('locationEnabled')} />
      </Section>

      <Section title="HỖ TRỢ & THÔNG TIN">
        <Row
          icon="support-agent"
          title="Tổng đài hỗ trợ"
          subtitle={site ? `${site.supportPhone} · ${site.supportHours}` : 'Đang tải…'}
          onPress={site?.supportPhone ? () => void Linking.openURL(`tel:${site.supportPhone.replace(/\s+/g, '')}`) : undefined}
        />
        <Row
          icon="mail-outline"
          title="Email hỗ trợ"
          subtitle={site?.supportEmail ?? 'Đang tải…'}
          onPress={site?.supportEmail ? () => void Linking.openURL(`mailto:${site.supportEmail}`) : undefined}
        />
        <Row icon="info-outline" title="Phiên bản" subtitle="SmartTravel Mobile 1.0.0" />
      </Section>

      <Pressable
        onPress={() =>
          Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi thiết bị này?', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đăng xuất', style: 'destructive', onPress: logout },
          ])
        }
        className="mt-6 flex-row items-center justify-center gap-2 rounded-2xl bg-[#FFE1DE] py-3.5"
      >
        <Icon name="logout" size={19} color="#D94848" />
        <Text className="text-[14px] font-bold text-[#D94848]">Đăng xuất</Text>
      </Pressable>
    </Screen>
  );
}
