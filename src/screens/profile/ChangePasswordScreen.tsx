import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { errorMessage } from '../../api/http';
import { useAuth } from '../../auth/AuthProvider';
import type { RootScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Icon } from '../../ui/Icon';
import { Header, Screen } from '../../ui/Screen';
import { Notice } from '../../ui/States';
import { isValidPassword, PASSWORD_HINT } from '../../utils/validation';

/** Đổi mật khẩu — giống ChangePasswordPage của web: máy này vẫn đăng nhập, máy khác bị đăng xuất */
export default function ChangePasswordScreen({ navigation }: RootScreenProps<'ChangePassword'>) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const rules = [
    { title: 'Tối thiểu 8 ký tự', valid: next.length >= 8 },
    { title: 'Có ít nhất 1 chữ in hoa (A-Z)', valid: /[A-Z]/.test(next) },
    { title: 'Có ít nhất 1 chữ thường (a-z)', valid: /[a-z]/.test(next) },
    { title: 'Có ít nhất 1 số (0-9)', valid: /\d/.test(next) },
    { title: 'Khác mật khẩu hiện tại', valid: Boolean(next) && next !== current },
  ];
  const score = rules.slice(0, 4).filter((rule) => rule.valid).length + (/[^A-Za-z0-9]/.test(next) ? 1 : 0);
  const strength =
    next.length === 0
      ? { label: 'Chưa nhập', color: '#8C9AB0', level: 0 }
      : score <= 2
        ? { label: 'Yếu', color: '#E87575', level: 1 }
        : score <= 4
          ? { label: 'Trung bình', color: '#D69E36', level: 2 }
          : { label: 'Khá mạnh', color: '#0E7490', level: 3 };
  const matches = confirm.length > 0 && confirm === next;

  const submit = async () => {
    if (!current || !next || !confirm) return setError('Vui lòng nhập đầy đủ các trường mật khẩu.');
    if (!isValidPassword(next)) return setError(`Mật khẩu mới chưa đủ mạnh: ${PASSWORD_HINT}.`);
    if (next === current) return setError('Mật khẩu mới phải khác mật khẩu hiện tại.');
    if (!matches) return setError('Mật khẩu xác nhận chưa trùng khớp.');
    setError(null);
    setBusy(true);
    try {
      await changePassword(current, next);
      setDone(true);
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setBusy(false);
    }
  };

  const header = <Header title="Đổi mật khẩu" subtitle="Bảo mật tài khoản" onBack={() => navigation.goBack()} />;

  if (done) {
    return (
      <Screen header={header}>
        <View className="items-center rounded-3xl bg-white p-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-[#E6F7F0]">
            <Icon name="verified-user" size={34} color={colors.success} />
          </View>
          <Text className="mt-3 text-[18px] font-extrabold text-[#13364A]">Đã đổi mật khẩu</Text>
          <Text className="mt-1 text-center text-[13px] leading-5 text-[#72818C]">
            Bạn vẫn đang đăng nhập trên thiết bị này. Các thiết bị khác đã được đăng xuất — hãy dùng
            mật khẩu mới khi đăng nhập lại.
          </Text>
          <Button title="Về trang cá nhân" style={{ marginTop: 18 }} onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={header}>
      <Notice tone="info">
        Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số. Thêm ký tự đặc biệt
        để bảo vệ tài khoản tốt hơn.
      </Notice>
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <Field label="Mật khẩu hiện tại" icon="lock-outline" secure value={current} onChangeText={setCurrent} placeholder="Nhập mật khẩu hiện tại" />
      <Pressable onPress={() => navigation.navigate('ForgotPassword')} className="-mt-2 mb-4 self-end">
        <Text className="text-[12.5px] font-bold text-[#0891B2]">Quên mật khẩu?</Text>
      </Pressable>
      <Field label="Mật khẩu mới" icon="lock" secure value={next} onChangeText={setNext} placeholder="Tạo mật khẩu mới" autoComplete="new-password" />

      <View className="-mt-2 mb-3">
        <View className="flex-row gap-1.5">
          {[1, 2, 3].map((level) => (
            <View
              key={level}
              style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: strength.level >= level ? strength.color : '#E3E8EF' }}
            />
          ))}
        </View>
        <Text style={{ color: strength.color }} className="mt-1 text-[11.5px] font-bold">
          Độ mạnh: {strength.label}
        </Text>
      </View>
      <View className="mb-4 gap-1">
        {rules.map((rule) => (
          <View key={rule.title} className="flex-row items-center gap-1.5">
            <Icon name={rule.valid ? 'check-circle' : 'radio-button-unchecked'} size={15} color={rule.valid ? colors.success : '#A5B6BE'} />
            <Text style={{ color: rule.valid ? colors.success : colors.muted }} className="text-[12px]">
              {rule.title}
            </Text>
          </View>
        ))}
      </View>

      <Field
        label="Xác nhận mật khẩu mới"
        icon="lock"
        secure
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Nhập lại mật khẩu mới"
        error={confirm.length > 0 && !matches ? 'Mật khẩu xác nhận chưa trùng khớp' : null}
      />
      <Button title="Cập nhật mật khẩu" icon="lock-reset" loading={busy} onPress={() => void submit()} />
    </Screen>
  );
}
