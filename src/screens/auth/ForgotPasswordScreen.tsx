import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../../ui/Typography';
import { authApi, type OtpSent } from '../../api/authApi';
import { ClientApiError, errorMessage } from '../../api/http';
import type { RootScreenProps } from '../../navigation/types';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Notice } from '../../ui/States';
import { isValidEmail, isValidPassword, PASSWORD_HINT } from '../../utils/validation';
import { AuthShell, AuthTitle, FooterLink, OtpStep, PasswordChecklist, StepIndicator } from './AuthParts';

const STEPS = ['Email', 'Xác thực', 'Mật khẩu mới'];

const TITLES = [
  { title: 'Quên mật khẩu', subtitle: 'Nhập email đã đăng ký — chúng tôi sẽ gửi mã 6 số để đặt lại mật khẩu.' },
  { title: 'Xác thực email', subtitle: 'Nhập mã 6 số trong email vừa nhận.' },
  { title: 'Mật khẩu mới', subtitle: 'Tạo mật khẩu mới. Các thiết bị đang đăng nhập sẽ được đăng xuất để an toàn.' },
];

/** Quên mật khẩu 3 bước: email → mã OTP → mật khẩu mới (giống web) */
export default function ForgotPasswordScreen({ navigation }: RootScreenProps<'ForgotPassword'>) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<OtpSent | null>(null);
  const [ticket, setTicket] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fail = (error: unknown) => {
    if (error instanceof ClientApiError && Object.keys(error.fieldErrors).length > 0) {
      setErrors(error.fieldErrors);
    }
    setFormError(errorMessage(error));
    setBusy(false);
  };

  const sendCode = async () => {
    setFormError(null);
    if (!isValidEmail(email)) {
      setErrors({ email: 'Vui lòng nhập email hợp lệ' });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      setSent(await authApi.sendResetCode(email));
      setStep(1);
      setBusy(false);
    } catch (error) {
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
      await authApi.resetPassword(ticket, password);
      navigation.replace('Login', {
        email,
        notice: 'Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới.',
      });
    } catch (error) {
      fail(error);
    }
  };

  return (
    <AuthShell onBack={() => navigation.goBack()}>
      <AuthTitle title={TITLES[step].title} subtitle={TITLES[step].subtitle} />
      <StepIndicator steps={STEPS} current={step} />

      {step === 0 ? (
        <View>
          {formError ? <Notice tone="danger">{formError}</Notice> : null}
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
          <Button title="Gửi mã xác thực" loading={busy} onPress={() => void sendCode()} />
        </View>
      ) : null}

      {step === 1 && sent ? (
        <View>
          <Text className="-mt-2 mb-3 text-center text-[12px] leading-5 text-[#8A99A6]">
            Nếu email này đã đăng ký, mã sẽ được gửi tới hộp thư của bạn.
          </Text>
          <OtpStep
            email={email}
            sent={sent}
            onVerify={async (code) => {
              const result = await authApi.verifyResetCode(email, code);
              setTicket(result.ticket);
              setErrors({});
              setFormError(null);
              setStep(2);
            }}
            onResend={() => authApi.sendResetCode(email)}
            onChangeEmail={() => {
              setStep(0);
              setSent(null);
            }}
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View>
          {formError ? <Notice tone="danger">{formError}</Notice> : null}
          <Field
            label="Mật khẩu mới"
            icon="lock-outline"
            placeholder="Tạo mật khẩu mới"
            secure
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
            error={errors.password ?? errors.newPassword}
          />
          <PasswordChecklist password={password} />
          <Field
            label="Nhập lại mật khẩu mới"
            icon="lock-outline"
            placeholder="Nhập lại mật khẩu"
            secure
            autoComplete="new-password"
            value={confirm}
            onChangeText={setConfirm}
            error={errors.confirm}
          />
          <Button title="Đặt lại mật khẩu" loading={busy} onPress={() => void finish()} />
        </View>
      ) : null}

      <FooterLink text="Nhớ ra mật khẩu?" link="Đăng nhập" onPress={() => navigation.navigate('Login')} />
    </AuthShell>
  );
}
