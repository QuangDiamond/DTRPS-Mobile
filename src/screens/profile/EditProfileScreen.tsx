import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { ClientApiError, errorMessage } from '../../api/http';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../auth/AuthProvider';
import { useAvatarUpload } from '../../components/useAvatarUpload';
import type { RootScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { Avatar } from '../../ui/Bits';
import { Button } from '../../ui/Button';
import { DatePickerSheet } from '../../ui/DatePickerSheet';
import { Field } from '../../ui/Field';
import { Icon } from '../../ui/Icon';
import { Header, Screen } from '../../ui/Screen';
import { Notice } from '../../ui/States';
import { addDays, formatDate, todayIso } from '../../utils/format';
import { isValidPhone, normalizePhone } from '../../utils/validation';

/** Chỉnh sửa hồ sơ — PUT /api/users/me (giống EditProfilePage của web) */
export default function EditProfileScreen({ navigation }: RootScreenProps<'EditProfile'>) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phoneNumber ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null);
  const [pickingDate, setPickingDate] = useState(false);
  // Ảnh đại diện lưu ngay khi chọn (không chờ bấm Lưu)
  const avatar = useAvatarUpload((updated) => setAvatarUrl(updated.avatarUrl ?? null));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (!user) return null;

  const submit = async () => {
    const next: Record<string, string> = {};
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 150) next.name = 'Họ tên phải có từ 2 đến 150 ký tự';
    if (phone.trim() && !isValidPhone(phone)) next.phoneNumber = 'Số điện thoại không hợp lệ';
    if (dateOfBirth && dateOfBirth >= todayIso()) next.dateOfBirth = 'Ngày sinh phải ở trong quá khứ';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const updated = await userApi.updateProfile({
        name: trimmedName,
        phoneNumber: phone.trim() ? normalizePhone(phone) : null,
        dateOfBirth: dateOfBirth || null,
        avatarUrl,
      });
      updateUser(updated);
      navigation.goBack();
    } catch (saveError) {
      if (saveError instanceof ClientApiError) setErrors(saveError.fieldErrors);
      setFormError(errorMessage(saveError));
      setSaving(false);
    }
  };

  return (
    <Screen
      header={<Header title="Chỉnh sửa hồ sơ" onBack={() => navigation.goBack()} />}
      footer={
        <View className="border-t border-[#E5F1F4] bg-white px-4 pb-4 pt-3">
          <Button title="Lưu thay đổi" icon="check" loading={saving} disabled={avatar.uploading} onPress={() => void submit()} />
        </View>
      }
    >
      <View className="mb-5 items-center">
        <Pressable onPress={() => void avatar.pick()} disabled={avatar.uploading} accessibilityLabel="Thay đổi ảnh đại diện">
          <Avatar name={name} url={avatarUrl} size={104} />
          <View className="absolute bottom-1 right-1 h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#0891B2]">
            {avatar.uploading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Icon name="photo-camera" size={18} color="#FFFFFF" />}
          </View>
        </Pressable>
        <Text className="mt-2 text-[12px] text-[#72818C]">Nhấn để thay đổi ảnh đại diện (lưu ngay)</Text>
        {avatarUrl ? (
          <Pressable onPress={avatar.remove} disabled={avatar.uploading} className="mt-1.5">
            <Text className="text-[12.5px] font-bold text-[#D83A48]">Gỡ ảnh đại diện</Text>
          </Pressable>
        ) : null}
      </View>

      {avatar.error || errors.avatarUrl ? <Notice tone="danger">{avatar.error ?? errors.avatarUrl}</Notice> : null}
      {formError ? <Notice tone="danger">{formError}</Notice> : null}

      <Field label="Họ và tên *" icon="person-outline" value={name} onChangeText={setName} autoCapitalize="words" error={errors.name} />
      <Field label="Email" icon="mail-outline" value={user.email} onChangeText={() => undefined} editable={false} hint="Email dùng để đăng nhập, không đổi được" />
      <Field
        label="Số điện thoại"
        icon="call"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="0912 345 678"
        error={errors.phoneNumber}
      />
      <Text className="mb-1.5 text-[12.5px] font-bold text-[#24404F]">Ngày sinh</Text>
      <Pressable
        onPress={() => setPickingDate(true)}
        style={{ borderColor: errors.dateOfBirth ? colors.danger : colors.line }}
        className="mb-1 h-[50px] flex-row items-center rounded-[14px] border bg-[#F3FBFC] px-3"
      >
        <Icon name="cake" size={19} color={colors.muted} />
        <Text className={`ml-2 flex-1 text-[14px] ${dateOfBirth ? 'text-[#0F2A3B]' : 'text-[#93A7B1]'}`}>
          {dateOfBirth ? formatDate(dateOfBirth) : 'Chọn ngày sinh'}
        </Text>
        {dateOfBirth ? (
          <Pressable onPress={() => setDateOfBirth('')} hitSlop={8} accessibilityLabel="Xóa ngày sinh">
            <Icon name="close" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </Pressable>
      {errors.dateOfBirth ? <Text className="text-[11.5px] text-[#D83A48]">{errors.dateOfBirth}</Text> : null}

      <DatePickerSheet
        visible={pickingDate}
        title="Ngày sinh"
        value={dateOfBirth || null}
        max={addDays(todayIso(), -1)}
        onClose={() => setPickingDate(false)}
        onSelect={setDateOfBirth}
      />
    </Screen>
  );
}
