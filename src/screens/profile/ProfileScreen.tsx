import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tripFlowApi } from '../../api/tripFlowApi';
import { useAuth } from '../../auth/AuthProvider';
import { useFavorites } from '../../auth/FavoritesProvider';
import { useNotifications } from '../../auth/NotificationsProvider';
import { LoginRequired } from '../../components/LoginRequired';
import { useAvatarUpload } from '../../components/useAvatarUpload';
import { useRootNav } from '../../navigation/hooks';
import { colors, shadow } from '../../theme';
import { Avatar } from '../../ui/Bits';
import { Icon, type IconName } from '../../ui/Icon';
import { Notice } from '../../ui/States';
import { todayIso } from '../../utils/format';

const ROLE_LABELS: Record<string, string> = {
  TRAVELLER: 'Du khách',
  BUSINESS_OWNER: 'Đối tác',
  ADMIN: 'Quản trị viên',
};

function MenuItem({
  icon,
  title,
  subtitle,
  badge,
  danger,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  badge?: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="min-h-[68px] flex-row items-center gap-3 px-4 py-3">
      <View
        style={{ backgroundColor: danger ? '#FFE1DE' : '#C0F4FA' }}
        className="h-10 w-10 items-center justify-center rounded-xl"
      >
        <Icon name={icon} size={21} color={danger ? '#D94848' : colors.primary} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className={`text-[14.5px] font-bold ${danger ? 'text-[#D94848]' : 'text-[#13364A]'}`}>{title}</Text>
        <Text numberOfLines={1} className="text-[12px] text-[#72818C]">
          {subtitle}
        </Text>
      </View>
      {badge ? (
        <View className="rounded-full bg-[#BBF5FC] px-2.5 py-1">
          <Text className="text-[10.5px] font-bold text-[#0E7490]">{badge}</Text>
        </View>
      ) : null}
      <Icon name={danger ? 'arrow-forward' : 'chevron-right'} size={21} color={danger ? '#D94848' : '#A0AEBA'} />
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-6">
      <Text className="mb-2 px-1 text-[11px] font-extrabold tracking-[1.4px] text-[#72818C]">{title}</Text>
      <View style={shadow.card} className="overflow-hidden rounded-3xl bg-white">
        {children}
      </View>
    </View>
  );
}

/** Hồ sơ du khách — giống ProfilePage của web */
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useRootNav();
  const { favoriteIds } = useFavorites();
  const { unread } = useNotifications();
  const [tripCount, setTripCount] = useState<number | null>(null);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const avatar = useAvatarUpload();

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;
      tripFlowApi
        .plans()
        .then((plans) => {
          if (!active) return;
          const today = todayIso();
          setTripCount(plans.length);
          setUpcomingCount(
            plans.filter(
              (plan) =>
                (plan.status === 'PLANNED' || plan.status === 'IN_PROGRESS' || plan.status === 'DRAFT') &&
                plan.endDate >= today,
            ).length,
          );
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, [user]),
  );

  if (!user) {
    return <LoginRequired title="Tài khoản của bạn" message="Đăng nhập để quản lý hồ sơ, chuyến đi và sở thích du lịch." />;
  }

  const confirmLogout = () =>
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi thiết bị này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={shadow.card} className="items-center rounded-3xl bg-white p-6">
          <Pressable onPress={() => void avatar.pick()} disabled={avatar.uploading} accessibilityLabel="Đổi ảnh đại diện">
            <Avatar name={user.name} url={user.avatarUrl} size={88} />
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#0891B2]">
              {avatar.uploading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Icon name="photo-camera" size={16} color="#FFFFFF" />}
            </View>
          </Pressable>
          <Text className="mt-3 text-[20px] font-extrabold text-[#13364A]">{user.name}</Text>
          <Text className="text-[13px] text-[#72818C]">{user.email}</Text>
          <View className="mt-2 flex-row gap-1.5">
            {user.roles.map((role) => (
              <View key={role} className="rounded-full bg-[#BBF5FC] px-2.5 py-1">
                <Text className="text-[11px] font-bold text-[#0E7490]">{ROLE_LABELS[role] ?? role}</Text>
              </View>
            ))}
          </View>
          {avatar.error ? (
            <View className="mt-3 self-stretch">
              <Notice tone="danger">{avatar.error}</Notice>
            </View>
          ) : null}
        </View>

        <View className="mt-4 flex-row gap-3">
          {[
            { value: tripCount ?? '–', label: 'Chuyến đi' },
            { value: favoriteIds.size, label: 'Điểm đã lưu' },
          ].map((item) => (
            <View key={item.label} style={shadow.card} className="flex-1 items-center rounded-2xl bg-white py-4">
              <Text className="text-[22px] font-extrabold text-[#0E7490]">{item.value}</Text>
              <Text className="text-[12px] text-[#72818C]">{item.label}</Text>
            </View>
          ))}
        </View>

        <Section title="HÀNH TRÌNH & YÊU THÍCH">
          <MenuItem icon="badge" title="Chỉnh sửa hồ sơ" subtitle="Cập nhật thông tin cá nhân & ảnh" onPress={() => navigation.navigate('EditProfile')} />
          <MenuItem
            icon="luggage"
            title="Chuyến đi của tôi"
            subtitle="Quản lý kế hoạch & lịch trình"
            badge={upcomingCount > 0 ? `${upcomingCount} sắp tới` : undefined}
            onPress={() => navigation.navigate('Tabs', { screen: 'Trips' })}
          />
          <MenuItem
            icon="favorite"
            title="Địa điểm yêu thích"
            subtitle="Bộ sưu tập điểm đến & quán ăn"
            badge={`${favoriteIds.size} điểm`}
            onPress={() => navigation.navigate('Tabs', { screen: 'Favorites' })}
          />
          <MenuItem icon="tune" title="Sở thích du lịch" subtitle="Trải nghiệm, phong cách, yêu cầu đặc biệt" onPress={() => navigation.navigate('Preferences')} />
        </Section>

        <Section title="CÀI ĐẶT & TIỆN ÍCH">
          <MenuItem
            icon="notifications-active"
            title="Thông báo"
            subtitle="Cập nhật đánh giá, chuyến đi & hệ thống"
            badge={unread > 0 ? `${unread} mới` : undefined}
            onPress={() => navigation.navigate('Notifications')}
          />
          <MenuItem icon="shield" title="Bảo mật tài khoản" subtitle="Đổi mật khẩu đăng nhập" onPress={() => navigation.navigate('ChangePassword')} />
          <MenuItem icon="settings" title="Cài đặt ứng dụng" subtitle="Thông báo, định vị, hỗ trợ" onPress={() => navigation.navigate('Settings')} />
          <MenuItem icon="logout" title="Đăng xuất" subtitle="Đăng xuất khỏi thiết bị này" danger onPress={confirmLogout} />
        </Section>

        <Text className="mt-6 text-center text-[11.5px] text-[#8793AB]">
          Smart Travel Vietnam AI • Mobile{'\n'}Khám phá Việt Nam theo cách thông minh nhất ✨
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
