import { type ElementRef, type ReactNode, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { Text, TextInput } from '../../ui/Typography';
import type { OtpSent } from '../../api/authApi';
import { errorMessage } from '../../api/http';
import { useAuth } from '../../auth/AuthProvider';
import { GoogleCancelled } from '../../auth/googleSignIn';
import { setPendingOnboarding } from './onboardingFlag';
import { colors } from '../../theme';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Screen } from '../../ui/Screen';
import { Notice } from '../../ui/States';
import { formatClock, useCountdown } from '../../utils/useCountdown';
import { maskEmail, PASSWORD_RULES } from '../../utils/validation';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80';

export function Brand() {
  return (
    <View className="mb-5 items-center">
      <View className="mb-2 h-14 w-14 items-center justify-center rounded-2xl bg-[#0891B2]">
        <Icon name="travel-explore" size={32} color="#FFFFFF" />
      </View>
      <Text className="text-[25px] font-extrabold text-[#0F2A3B]">
        Smart<Text className="text-[#0891B2]">Travel</Text>
      </Text>
      <Text className="text-[9.5px] font-extrabold tracking-[1.6px] text-[#0E7490]">
        VIETNAM AI TRAVEL PLANNER
      </Text>
    </View>
  );
}

/** Khung chung của các màn đăng nhập / đăng ký: ảnh nền + thẻ trắng */
export function AuthShell({
  children,
  onBack,
}: {
  children: ReactNode;
  onBack?: () => void;
}) {
  return (
    <Screen contentStyle={{ padding: 0, paddingBottom: 32 }}>
      <View style={{ height: 170, backgroundColor: '#DCF5F8' }}>
        <Image source={{ uri: HERO_IMAGE }} style={{ width: '100%', height: '100%', opacity: 0.4 }} />
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityLabel="Quay lại"
            className="absolute left-4 top-3 h-10 w-10 items-center justify-center rounded-full bg-white/90"
          >
            <Icon name="arrow-back" size={22} />
          </Pressable>
        ) : null}
      </View>
      <View
        className="mx-4 -mt-16 rounded-3xl border border-[#E8EDF2] bg-white p-5"
        style={{ shadowColor: '#13364A', shadowOpacity: 0.06, shadowRadius: 18, elevation: 3 }}
      >
        {children}
      </View>
    </Screen>
  );
}

export function AuthTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-4">
      <Text className="text-center text-[20px] font-extrabold text-[#0F2A3B]">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 text-center text-[12.5px] leading-5 text-[#62737F]">{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <View className="mb-5 flex-row items-center">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <View key={label} className="flex-1 items-center">
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: done || active ? colors.primary : '#E6EEF1',
              }}
            >
              {done ? (
                <Icon name="check" size={16} color="#FFFFFF" />
              ) : (
                <Text style={{ color: active ? '#FFFFFF' : colors.muted, fontWeight: '800', fontSize: 12 }}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              numberOfLines={1}
              style={{ color: active ? colors.ink : colors.muted }}
              className="mt-1 text-[10.5px] font-bold"
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function PasswordChecklist({ password }: { password: string }) {
  return (
    <View className="-mt-2 mb-4 flex-row flex-wrap gap-x-4 gap-y-1">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <View key={rule.label} className="flex-row items-center gap-1">
            <Icon
              name={ok ? 'check-circle' : 'radio-button-unchecked'}
              size={14}
              color={ok ? colors.success : '#A5B6BE'}
            />
            <Text style={{ color: ok ? colors.success : colors.muted }} className="text-[11.5px]">
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const DIGITS = 6;

/** Nhập mã 6 số: một ô ẩn nhận bàn phím, 6 ô hiển thị */
function OtpInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const ref = useRef<ElementRef<typeof TextInput>>(null);
  return (
    <Pressable onPress={() => ref.current?.focus()} className="mb-4">
      <View className="flex-row justify-between">
        {Array.from({ length: DIGITS }, (_, i) => {
          const char = value[i] ?? '';
          const active = i === value.length;
          return (
            <View
              key={i}
              style={{
                width: 44,
                height: 52,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: active ? colors.primary : colors.line,
                backgroundColor: colors.field,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-[22px] font-extrabold text-[#0F2A3B]">{char}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, DIGITS))}
        keyboardType="number-pad"
        autoFocus
        editable={!disabled}
        maxLength={DIGITS}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
      />
    </Pressable>
  );
}

/** Bước nhập mã OTP — bản mobile của OtpStep (client/ui/AuthParts.tsx) */
export function OtpStep({
  email,
  sent,
  onVerify,
  onResend,
  onChangeEmail,
}: {
  email: string;
  sent: OtpSent;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<OtpSent>;
  onChangeEmail: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const expiry = useCountdown(sent.expiresInSeconds);
  const resend = useCountdown(sent.resendInSeconds);

  const verify = async (value = code) => {
    if (value.length !== DIGITS || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onVerify(value);
    } catch (failure) {
      setError(errorMessage(failure));
      setCode('');
      setBusy(false);
    }
  };

  const again = async () => {
    setResending(true);
    setError(null);
    setInfo(null);
    try {
      const next = await onResend();
      expiry.restart(next.expiresInSeconds);
      resend.restart(next.resendInSeconds);
      setCode('');
      setInfo('Đã gửi mã mới, vui lòng kiểm tra hộp thư (cả mục Spam / Quảng cáo).');
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setResending(false);
    }
  };

  return (
    <View>
      <View className="mb-4 flex-row items-center gap-3 rounded-2xl bg-[#F1F9FA] p-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
          <Icon name="mark-email-read" size={22} color={colors.primary} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-[12px] text-[#4F5F6B]">Mã 6 số đã được gửi tới</Text>
          <Text numberOfLines={1} className="text-[13px] font-bold text-[#0F2A3B]">
            {maskEmail(email)}
          </Text>
        </View>
        <Pressable onPress={onChangeEmail} hitSlop={8}>
          <Text className="text-[12px] font-bold text-[#0891B2]">Đổi email</Text>
        </Pressable>
      </View>

      {error ? <Notice tone="danger">{error}</Notice> : null}
      {info && !error ? <Notice tone="info">{info}</Notice> : null}

      <OtpInput
        value={code}
        disabled={busy}
        onChange={(value) => {
          setCode(value);
          setError(null);
          if (value.length === DIGITS) void verify(value);
        }}
      />

      <Text className="mb-4 text-center text-[12px] text-[#62737F]">
        {expiry.left > 0 ? `Mã hết hạn sau ${formatClock(expiry.left)}` : 'Mã đã hết hạn, hãy gửi mã mới'}
      </Text>

      <Button title="Xác nhận" loading={busy} disabled={code.length !== DIGITS} onPress={() => void verify()} />

      <View className="mt-4 flex-row justify-center">
        {resend.left > 0 ? (
          <Text className="text-[12.5px] text-[#62737F]">Gửi lại mã sau {formatClock(resend.left)}</Text>
        ) : (
          <Pressable onPress={() => void again()} disabled={resending} hitSlop={8}>
            <Text className="text-[12.5px] font-bold text-[#0891B2]">
              {resending ? 'Đang gửi…' : 'Gửi lại mã'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function FooterLink({ text, link, onPress }: { text: string; link: string; onPress: () => void }) {
  return (
    <View className="mt-5 flex-row flex-wrap justify-center">
      <Text className="text-[13px] text-[#62737F]">{text} </Text>
      <Pressable onPress={onPress} hitSlop={6}>
        <Text className="text-[13px] font-bold text-[#0891B2]">{link}</Text>
      </Pressable>
    </View>
  );
}

/**
 * "Tiếp tục với Google" — giống GoogleButton của web: chỉ cho du khách; tài khoản mới thì vào màn
 * câu hỏi sở thích trước.
 */
export function GoogleButton() {
  const { loginWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setError(null);
    setBusy(true);
    try {
      const { newAccount } = await loginWithGoogle();
      if (newAccount) setPendingOnboarding(true);
      // Danh sách màn hình tự đổi sang khu đã đăng nhập
    } catch (failure) {
      if (!(failure instanceof GoogleCancelled)) setError(errorMessage(failure));
      setBusy(false);
    }
  };

  return (
    <View className="mt-5">
      <View className="mb-4 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-[#E3E8EC]" />
        <Text className="text-[12px] text-[#8A99A6]">hoặc</Text>
        <View className="h-px flex-1 bg-[#E3E8EC]" />
      </View>
      <Pressable
        onPress={() => void signIn()}
        disabled={busy}
        accessibilityRole="button"
        style={{ opacity: busy ? 0.7 : 1 }}
        className="h-[50px] flex-row items-center justify-center gap-2.5 rounded-full border border-[#DADCE0] bg-white"
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={{ color: '#4285F4' }} className="text-[19px] font-extrabold">
            G
          </Text>
        )}
        <Text className="text-[14px] font-bold text-[#3C4043]">
          {busy ? 'Đang đăng nhập với Google…' : 'Tiếp tục với Google'}
        </Text>
      </Pressable>
      {error ? <Text className="mt-2 text-center text-[12px] text-[#D83A48]">{error}</Text> : null}
    </View>
  );
}
