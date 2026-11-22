import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { errorMessage } from '../api/http';
import type { ClientUser } from '../api/types';
import { userApi } from '../api/userApi';
import { useAuth } from '../auth/AuthProvider';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/** Đổi / gỡ ảnh đại diện rồi cập nhật người dùng đang đăng nhập ngay (giống useAvatarUpload của web) */
export function useAvatarUpload(onChanged?: (user: ClientUser) => void) {
  const { updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<ClientUser>) => {
    setUploading(true);
    setError(null);
    try {
      const updated = await action();
      updateUser(updated);
      onChanged?.(updated);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setUploading(false);
    }
  };

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Cần cho phép truy cập thư viện ảnh để đổi ảnh đại diện.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const type = asset.mimeType ?? 'image/jpeg';
    if (!ACCEPTED.includes(type)) {
      setError('Chỉ nhận ảnh JPG, PNG hoặc WEBP');
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_BYTES) {
      setError('Ảnh tối đa 5MB');
      return;
    }
    await run(() =>
      userApi.uploadAvatar({
        uri: asset.uri,
        name: asset.fileName ?? `avatar.${type.split('/')[1] ?? 'jpg'}`,
        type,
      }),
    );
  };

  const remove = () => void run(() => userApi.removeAvatar());

  return { uploading, error, pick, remove };
}
