import { appendFile, buildQuery, clientRequest, type UploadFile } from './http';
import type {
  AuthResponse,
  ClientUser,
  Paged,
  PlaceSummary,
  ProfileInput,
  TravelPreferences,
} from './types';

export interface FavoritesQuery {
  page?: number;
  size?: number;
  keyword?: string;
  /** Mã nhóm dịch vụ (lodging, fnb, attraction, shopping) */
  group?: string;
  sort?: 'recent' | 'name';
}

export const userApi = {
  me: () => clientRequest<ClientUser>('/users/me'),

  /** Cập nhật họ tên, số điện thoại, ngày sinh, ảnh đại diện (email không đổi được) */
  updateProfile: (input: ProfileInput) =>
    clientRequest<ClientUser>('/users/me', { method: 'PUT', body: input }),

  /** Đổi ảnh đại diện — BE lưu luôn và trả hồ sơ mới */
  uploadAvatar: (file: UploadFile) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    return clientRequest<ClientUser>('/users/me/avatar', {
      method: 'POST',
      body: form,
      timeoutMs: 60_000,
    });
  },

  removeAvatar: () => clientRequest<ClientUser>('/users/me/avatar', { method: 'DELETE' }),

  preferences: () => clientRequest<TravelPreferences>('/users/me/preferences'),

  updatePreferences: (input: TravelPreferences) =>
    clientRequest<TravelPreferences>('/users/me/preferences', { method: 'PUT', body: input }),

  /** Đổi mật khẩu: các thiết bị khác bị đăng xuất, thiết bị này nhận phiên mới */
  changePassword: (currentPassword: string, newPassword: string) =>
    clientRequest<AuthResponse>('/auth/password/change', {
      method: 'POST',
      body: { currentPassword, newPassword },
    }),

  /** Địa điểm đã lưu */
  favorites: ({ page = 0, size = 20, keyword, group, sort }: FavoritesQuery = {}) =>
    clientRequest<Paged<PlaceSummary>>(
      `/users/me/favorites?${buildQuery({
        page,
        size,
        keyword: keyword?.trim(),
        group: group && group !== 'all' ? group : undefined,
        sort,
      })}`,
    ),

  /** Lưu lại lần nữa không lỗi */
  addFavorite: (placeId: string | number) =>
    clientRequest<void>(`/users/me/favorites/${placeId}`, { method: 'PUT' }),

  /** Bỏ lại lần nữa cũng không lỗi */
  removeFavorite: (placeId: string | number) =>
    clientRequest<void>(`/users/me/favorites/${placeId}`, { method: 'DELETE' }),
};

