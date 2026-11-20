import { clientRequest } from './httpClient';

/**
 * Mirror tối giản của DTRPS-Web/src/client/api/userApi.ts (chỉ phần Preferences, UC-006) —
 * cùng Backend: GET/PUT /api/users/me/preferences (UserController.preferences/updatePreferences).
 * Đặt tên UserPreferences (khác TravelPreferences cũ ở constants/travelPreferences.ts, vẫn được
 * PlanTripScreen dùng cho phần chọn sở thích tại chỗ của riêng nó) để không lẫn hai khái niệm.
 */
export interface UserPreferences {
  notes: string | null;
  /** Mã place_categories.code — KHÔNG phải mã bảng interests. */
  interests: string[];
  /** Mã special_needs.code. */
  specialNeeds: string[];
  /** Mã câu hỏi cá nhân hóa (PURPOSE_*, STYLE_*, EXPERIENCE_*, MEMORY_*). */
  experiencePreferences: string[];
}

export const userApi = {
  preferences: () => clientRequest<UserPreferences>('/users/me/preferences'),

  updatePreferences: (input: UserPreferences) =>
    clientRequest<UserPreferences>('/users/me/preferences', { method: 'PUT', body: input }),
};
