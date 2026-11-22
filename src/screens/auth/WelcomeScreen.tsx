import { Pressable, View } from 'react-native';
import { Text } from '../../ui/Typography';
import type { RootScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { Button } from '../../ui/Button';
import { Icon, type IconName } from '../../ui/Icon';
import { AuthShell, Brand, FooterLink } from './AuthParts';

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'explore', title: 'Khám phá điểm đến', text: 'Hàng trăm địa điểm có ảnh, giờ mở cửa, giá và bản đồ.' },
  { icon: 'tune', title: 'Gợi ý theo sở thích', text: 'AI chấm % phù hợp và giải thích vì sao gợi ý từng nơi.' },
  { icon: 'event-note', title: 'Lập lịch trình', text: 'Tự chia lịch theo ngày, chỉ đường và theo dõi chuyến đi.' },
];

/** Màn chào mừng cho khách chưa đăng nhập — giống WelcomePage của web */
export default function WelcomeScreen({ navigation }: RootScreenProps<'Welcome'>) {
  return (
    <AuthShell>
      <Brand />
      <Text className="text-center text-[19px] font-extrabold text-[#0F2A3B]">
        Lên kế hoạch du lịch Việt Nam dễ dàng hơn
      </Text>
      <View className="mt-5 gap-3.5">
        {FEATURES.map((feature) => (
          <View key={feature.title} className="flex-row items-start gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#E3F5F7]">
              <Icon name={feature.icon} size={20} color={colors.primary} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[13.5px] font-bold text-[#0F2A3B]">{feature.title}</Text>
              <Text className="text-[12.5px] leading-[18px] text-[#62737F]">{feature.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <Button
        title="Tạo tài khoản"
        iconRight="arrow-forward"
        style={{ marginTop: 22 }}
        onPress={() => navigation.navigate('Register')}
      />
      <FooterLink text="Đã có tài khoản?" link="Đăng nhập" onPress={() => navigation.navigate('Login')} />

      <Pressable
        onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
        className="mt-5 flex-row items-center justify-center gap-2 self-center rounded-full border border-[#9CD5DB] bg-white px-5 py-2.5"
      >
        <Icon name="explore" size={18} color={colors.primary} />
        <Text className="text-[13px] font-bold text-[#0891B2]">Khám phá ngay, chưa cần tài khoản</Text>
      </Pressable>
    </AuthShell>
  );
}
