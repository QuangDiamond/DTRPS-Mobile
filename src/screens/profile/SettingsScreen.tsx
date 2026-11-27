import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Linking, Switch, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { useAuth } from '../../auth/AuthProvider';
import { useI18n } from '../../i18n/I18nProvider';
import type { RootScreenProps } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { Avatar } from '../../ui/Bits';
import { Icon, type IconName } from '../../ui/Icon';
import { FadeInView, ScalePressable } from '../../ui/Motion';
import { Header, Screen } from '../../ui/Screen';
import { Toast, useToast } from '../../ui/Toast';
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
  const { lang, setLang } = useI18n();
  const [toast, showToast] = useToast();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [segmentWidth, setSegmentWidth] = useState(0);
  const thumbX = useRef(new Animated.Value(lang === 'en' ? 1 : 0)).current;

  useEffect(() => {
    void loadAppSettings().then(setSettings);
  }, []);

  useEffect(() => {
    Animated.spring(thumbX, {
      toValue: lang === 'en' ? 1 : 0,
      useNativeDriver: true,
      speed: 22,
      bounciness: 6,
    }).start();
  }, [lang, thumbX]);

  if (!user) return null;

  const halfWidth = segmentWidth > 8 ? (segmentWidth - 8) / 2 : 0;
  const thumbTranslateX = thumbX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, halfWidth],
  });

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    void saveAppSettings(next);
  };

  const toggle = (key: keyof AppSettings, disabled = false) => (
    <Switch
      value={disabled ? false : settings[key]}
      disabled={disabled}
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

      <Section title="NGÔN NGỮ">
        <View className="px-4 py-3.5">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#ECFEFF]">
              <Icon name="translate" size={20} color={colors.primary} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[14px] font-bold text-[#13364A]">Ngôn ngữ</Text>
              <Text className="text-[12px] text-[#72818C]">
                Chọn ngôn ngữ hiển thị cho ứng dụng
              </Text>
            </View>
          </View>
          <View
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0 && w !== segmentWidth) setSegmentWidth(w);
            }}
            className="relative mt-3 flex-row rounded-2xl bg-[#EEF5F7] p-1"
          >
            {halfWidth > 0 ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  shadow.card,
                  {
                    position: 'absolute',
                    top: 4,
                    bottom: 4,
                    left: 4,
                    width: halfWidth,
                    borderRadius: 12,
                    backgroundColor: '#FFFFFF',
                    transform: [{ translateX: thumbTranslateX }],
                  },
                ]}
              />
            ) : null}
            {(
              [
                { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
                { code: 'en', flag: '🇬🇧', label: 'English' },
              ] as const
            ).map((option) => {
              const active = lang === option.code;
              return (
                <View key={option.code} className="flex-1">
                  <ScalePressable
                    scaleTo={0.96}
                    onPress={() => {
                      if (lang === option.code) return;
                      setLang(option.code);
                      showToast(
                        option.code === 'en' ? 'Switched to English' : 'Đã chuyển sang Tiếng Việt',
                      );
                    }}
                    className="flex-row items-center justify-center gap-1.5 rounded-xl py-2.5"
                  >
                    <Text className="text-[14px]">{option.flag}</Text>
                    <Text
                      className={`text-[13px] font-extrabold ${
                        active ? 'text-[#0E7490]' : 'text-[#557080]'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </ScalePressable>
                </View>
              );
            })}
          </View>
        </View>
      </Section>

      <Section title="THÔNG BÁO & QUYỀN ỨNG DỤNG">
        <Row
          icon="notifications-active"
          title="Bật thông báo"
          subtitle="Hiện thông báo nổi & trên thanh trạng thái"
          right={toggle('pushNotification')}
        />
        <View style={{ opacity: settings.pushNotification ? 1 : 0.45 }}>
          <Row
            icon="alarm"
            title="Nhắc lịch trình"
            subtitle="Nhắc trước ngày khởi hành & đánh giá chuyến"
            right={toggle('tripReminder', !settings.pushNotification)}
          />
          <Row
            icon="thunderstorm"
            title="Cảnh báo thời tiết"
            subtitle="Khi thời tiết ảnh hưởng lịch trình"
            right={toggle('weatherNotification', !settings.pushNotification)}
          />
        </View>
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
      <Toast message={toast} />
    </Screen>
  );
}
