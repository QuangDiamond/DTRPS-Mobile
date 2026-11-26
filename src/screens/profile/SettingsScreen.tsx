import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Switch, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { useAuth } from '../../auth/AuthProvider';
import type { RootScreenProps } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { Avatar } from '../../ui/Bits';
import { Icon, type IconName } from '../../ui/Icon';
import { FadeInView, ScalePressable } from '../../ui/Motion';
import { Header, Screen } from '../../ui/Screen';
import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  saveAppSettings,
  type AppSettings,
} from '../../utils/appSettings';

const SUPPORT_PHONE = '0973954275';
const SUPPORT_EMAIL = 'smarttravel.dtrps@gmail.com';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <FadeInView offset={10} duration={240} style={{ marginTop: 20 }}>
      <Text className="mb-2 px-1 text-[11px] font-extrabold tracking-[1.4px] text-[#72818C]">
        {title}
      </Text>
      <View style={shadow.card} className="overflow-hidden rounded-3xl bg-white">
        {children}
      </View>
    </FadeInView>
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
  const content = (
    <View className="min-h-[64px] flex-row items-center gap-3 px-4 py-3">
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
    </View>
  );
  if (!onPress) return content;
  return (
    <ScalePressable scaleTo={0.98} onPress={onPress}>
      {content}
    </ScalePressable>
  );
}

/** Cài đặt ứng dụng — giống SettingsPage của web */
export default function SettingsScreen({ navigation }: RootScreenProps<'Settings'>) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

  useEffect(() => {
    void loadAppSettings().then(setSettings);
  }, []);

  if (!user) return null;

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    void saveAppSettings(next);
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
    <Screen
      header={
        <Header
          title="Cài đặt ứng dụng"
          subtitle="SmartTravel"
          onBack={() => navigation.goBack()}
        />
      }
    >
      <ScalePressable
        scaleTo={0.975}
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
      </ScalePressable>

      <Section title="THÔNG BÁO & QUYỀN ỨNG DỤNG">
        <Row
          icon="notifications-active"
          title="Thông báo đẩy"
          subtitle="Cập nhật quan trọng về tài khoản"
          right={toggle('pushNotification')}
        />
        <Row
          icon="alarm"
          title="Nhắc lịch trình"
          subtitle="Nhắc trước ngày khởi hành & đánh giá chuyến"
          right={toggle('tripReminder')}
        />
        <Row
          icon="thunderstorm"
          title="Cảnh báo thời tiết"
          subtitle="Khi thời tiết ảnh hưởng lịch trình"
          right={toggle('weatherNotification')}
        />
        <Row
          icon="admin-panel-settings"
          title="Quyền ứng dụng (GPS & Thông báo)"
          subtitle="Mở cài đặt hệ thống để cấp lại quyền vị trí, thông báo"
          onPress={() => void Linking.openSettings()}
        />
      </Section>

      <Section title="HỖ TRỢ & THÔNG TIN">
        <Row
          icon="support-agent"
          title="Tổng đài hỗ trợ"
          subtitle={SUPPORT_PHONE}
          onPress={() => void Linking.openURL(`tel:${SUPPORT_PHONE}`)}
        />
        <Row
          icon="mail-outline"
          title="Email hỗ trợ"
          subtitle={SUPPORT_EMAIL}
          onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        />
        <Row icon="info-outline" title="Phiên bản" subtitle="SmartTravel Mobile 1.0.0" />
      </Section>
    </Screen>
  );
}
