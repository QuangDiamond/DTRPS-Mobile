import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { ClientApiError, errorMessage } from '../../api/http';
import { useAuth } from '../../auth/AuthProvider';
import type { RootScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Icon } from '../../ui/Icon';
import { Notice } from '../../ui/States';
import { isValidEmail } from '../../utils/validation';
import { AuthShell, AuthTitle, Brand, FooterLink, GoogleButton } from './AuthParts';
import { setPendingOnboarding } from './onboardingFlag';

/** Đăng nhập cổng du khách — cùng tài khoản và cùng quy tắc với trang /login của web */
export default function LoginScreen({ navigation, route }: RootScreenProps<'Login'>) {
  const { login, endedReason } = useAuth();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [partnerAccount, setPartnerAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const notice = route.params?.notice;

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!isValidEmail(email)) next.email = 'Nhập địa chỉ email hợp lệ';
    if (!password) next.password = 'Vui lòng nhập mật khẩu';
    setErrors(next);
    setFormError(null);
    setPartnerAccount(false);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const { firstLogin } = await login(email, password, remember);
      // Lần đầu sau khi đăng ký: trả lời câu hỏi sở thích trước (giống web)
      if (firstLogin) setPendingOnboarding(true);
      // Danh sách màn hình tự đổi sang khu đã đăng nhập khi có user
    } catch (error) {
      // Tài khoản đối tác: Backend chặn ở cổng du khách (403)
      setPartnerAccount(error instanceof ClientApiError && error.status === 403 && error.message.includes('cổng'));
      setFormError(errorMessage(error));
      setBusy(false);
    }
  };

  return (
    <AuthShell onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}>
      <Brand />
      <AuthTitle title="Đăng nhập" subtitle="Chào mừng trở lại! Tiếp tục hành trình khám phá Việt Nam của bạn." />

      {endedReason === 'expired' && !formError ? (
        <Notice tone="warning" title="Phiên đăng nhập đã hết hạn">
          Phiên làm việc đã hết hạn hoặc tài khoản vừa đăng xuất ở nơi khác. Vui lòng đăng nhập lại.
        </Notice>
      ) : null}
      {notice && !formError ? <Notice tone="success">{notice}</Notice> : null}
      {formError ? <Notice tone="danger">{formError}</Notice> : null}
      {partnerAccount ? (
        <Notice tone="info">
          Ứng dụng di động dành cho du khách. Tài khoản đối tác vui lòng đăng nhập trên trang web SmartTravel.
        </Notice>
      ) : null}

      <Field
        label="Email"
        icon="mail-outline"
        placeholder="ban@gmail.com"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />
      <Field
        label="Mật khẩu"
        icon="lock-outline"
        placeholder="Nhập mật khẩu"
        secure
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />

      <View className="mb-5 flex-row items-center justify-between">
        <Pressable onPress={() => setRemember((v) => !v)} className="flex-row items-center gap-1.5" hitSlop={6}>
          <Icon name={remember ? 'check-box' : 'check-box-outline-blank'} size={20} color={colors.primary} />
          <Text className="text-[12.5px] text-[#4F5F6B]">Ghi nhớ đăng nhập</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={6}>
          <Text className="text-[12.5px] font-bold text-[#0891B2]">Quên mật khẩu?</Text>
        </Pressable>
      </View>

      <Button title="Đăng nhập" loading={busy} onPress={() => void submit()} />
      <GoogleButton />

      <FooterLink text="Chưa có tài khoản?" link="Tạo tài khoản" onPress={() => navigation.navigate('Register')} />
    </AuthShell>
  );
}
