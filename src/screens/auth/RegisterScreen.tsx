import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../../ui/Typography';
import { authApi, type OtpSent } from '../../api/authApi';
import { ClientApiError, errorMessage } from '../../api/http';
import { onboarding } from '../../auth/sessionStore';
import type { RootScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Icon } from '../../ui/Icon';
import { Notice } from '../../ui/States';
import { isValidEmail, isValidPassword, PASSWORD_HINT } from '../../utils/validation';
import { AuthShell, AuthTitle, FooterLink, GoogleButton, OtpStep, PasswordChecklist, StepIndicator } from './AuthParts';

const STEPS = ['Thông tin', 'Xác thực email', 'Mật khẩu'];

const TITLES = [
  { title: 'Tạo tài khoản', subtitle: 'Nhập họ tên và email — chúng tôi sẽ gửi mã xác thực 6 số.' },
  { title: 'Xác thực email', subtitle: 'Nhập mã 6 số trong email vừa nhận để xác nhận địa chỉ.' },
  { title: 'Đặt mật khẩu', subtitle: 'Bước cuối: tạo mật khẩu để đăng nhập lần sau.' },
];

/** Đăng ký du khách 3 bước (OTP qua email) — giống RegisterPage của web */
export default function RegisterScreen({ navigation }: RootScreenProps<'Register'>) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<OtpSent | null>(null);
  const [ticket, setTicket] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

  const fail = (error: unknown) => {
    if (error instanceof ClientApiError && Object.keys(error.fieldErrors).length > 0) {
      setErrors(error.fieldErrors);
    }
    setFormError(errorMessage(error));
    setBusy(false);
  };

  const sendCode = async () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Họ tên phải có ít nhất 2 ký tự';
    if (!isValidEmail(email)) next.email = 'Email không hợp lệ';
    setErrors(next);
    setFormError(null);
    setEmailTaken(false);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      setSent(await authApi.sendRegisterCode(name, email));
      setStep(1);
      setBusy(false);
    } catch (error) {
      setEmailTaken(error instanceof ClientApiError && error.status === 409);
      fail(error);
    }
  };

  const finish = async () => {
    const next: Record<string, string> = {};
    if (!isValidPassword(password)) next.password = PASSWORD_HINT;
    if (confirm !== password) next.confirm = 'Mật khẩu nhập lại chưa khớp';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const created = await authApi.completeRegistration(ticket, name, password);
      // Không tự đăng nhập: bỏ phiên vừa cấp, người dùng đăng nhập lại bằng email + mật khẩu
      authApi.revoke(created.refreshToken).catch(() => undefined);
      // Lần đăng nhập đầu tiên → trả lời câu hỏi sở thích
      await onboarding.mark(created.user.email);
      setCreatedEmail(created.user.email);
      setBusy(false);
    } catch (error) {
      fail(error);
    }
  };

  if (createdEmail) {
    return (
      <AuthShell>
        <View className="items-center py-2">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-[#E6F7F0]">
            <Icon name="check-circle" size={40} color={colors.success} />
          </View>
          <Text className="mt-3 text-[20px] font-extrabold text-[#0F2A3B]">Đăng ký thành công!</Text>
          <Text className="mt-1 text-center text-[13px] leading-5 text-[#62737F]">
            Tài khoản {createdEmail} đã được tạo. Hãy đăng nhập bằng mật khẩu vừa đặt.
          </Text>
        </View>
        <Button
          title="Đăng nhập ngay"
          iconRight="arrow-forward"
          style={{ marginTop: 18 }}
          onPress={() =>
            navigation.replace('Login', {
              email: createdEmail,
              notice: 'Đăng ký tài khoản thành công! Hãy đăng nhập bằng mật khẩu vừa tạo.',
            })
          }
        />
      </AuthShell>
    );
  }

  const mismatch = confirm.length > 0 && confirm !== password;
  const matched = confirm.length > 0 && confirm === password;

  return (
    <AuthShell onBack={() => navigation.goBack()}>
      <AuthTitle title={TITLES[step].title} subtitle={TITLES[step].subtitle} />
      <StepIndicator steps={STEPS} current={step} />

      {step === 0 ? (
        <View>
          {formError ? <Notice tone="danger">{formError}</Notice> : null}
          {emailTaken ? (
            <View className="-mt-1 mb-3 flex-row flex-wrap">
              <Text className="text-[12.5px] font-bold text-[#0891B2]" onPress={() => navigation.navigate('Login', { email })}>
                Đăng nhập
              </Text>
              <Text className="text-[12.5px] text-[#4F5F6B]"> hoặc </Text>
              <Text className="text-[12.5px] font-bold text-[#0891B2]" onPress={() => navigation.navigate('ForgotPassword')}>
                lấy lại mật khẩu
              </Text>
            </View>
          ) : null}
          <Field
            label="Họ và tên"
            icon="person-outline"
            placeholder="Nguyễn Hoàng Nam"
            autoComplete="name"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />
          <Field
            label="Email"
            icon="mail-outline"
            placeholder="ban@gmail.com"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            hint="Mã xác thực sẽ được gửi tới email này"
          />
          <Button title="Gửi mã xác thực" loading={busy} onPress={() => void sendCode()} />
          <GoogleButton />
        </View>
      ) : null}

      {step === 1 && sent ? (
        <OtpStep
          email={email}
          sent={sent}
          onVerify={async (code) => {
            const result = await authApi.verifyRegisterCode(email, code);
            setTicket(result.ticket);
            setErrors({});
            setFormError(null);
            setStep(2);
          }}
          onResend={() => authApi.sendRegisterCode(name, email)}
          onChangeEmail={() => {
            setStep(0);
            setSent(null);
          }}
        />
      ) : null}

      {step === 2 ? (
        <View>
          {formError ? <Notice tone="danger">{formError}</Notice> : null}
          <Field
            label="Mật khẩu"
            icon="lock-outline"
            placeholder="Tạo mật khẩu"
            secure
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />
          <PasswordChecklist password={password} />
          <Field
            label="Nhập lại mật khẩu"
            icon="lock-outline"
            placeholder="Nhập lại mật khẩu"
            secure
            autoComplete="new-password"
            value={confirm}
            onChangeText={setConfirm}
            error={mismatch ? 'Mật khẩu nhập lại chưa khớp' : errors.confirm}
          />
          {matched ? (
            <View className="-mt-2 mb-4 flex-row items-center gap-1">
              <Icon name="check-circle" size={16} color={colors.success} />
              <Text className="text-[12px] font-semibold text-[#13936B]">Mật khẩu khớp</Text>
            </View>
          ) : null}
          <Button
            title="Tạo tài khoản"
            loading={busy}
            disabled={!isValidPassword(password) || !matched}
            onPress={() => void finish()}
          />
        </View>
      ) : null}

      <FooterLink text="Đã có tài khoản?" link="Đăng nhập" onPress={() => navigation.navigate('Login')} />
    </AuthShell>
  );
}
