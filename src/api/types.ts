/** Kiểu dữ liệu Backend trả về cho du khách — giống DTRPS-Web/src/client/api/types.ts */

export type RoleName = 'TRAVELLER' | 'BUSINESS_OWNER' | 'ADMIN';

export interface ClientUser {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  avatarUrl: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  roles: RoleName[];
}

export interface ProfileInput {
  name: string;
  phoneNumber: string | null;
  /** yyyy-MM-dd */
  dateOfBirth: string | null;
  avatarUrl: string | null;
}

/**
 * Sở thích du lịch (GET/PUT /api/users/me/preferences).
 * {@code interests} là mã loại hình địa điểm (place_categories), ví dụ "restaurant", "heritage".
 */
export interface TravelPreferences {
  notes: string | null;
  interests: string[];
  specialNeeds: string[];
  /** Mã trả lời cá nhân hóa (mục đích/phong cách/trải nghiệm/kỷ niệm) — dùng chung với TravelPlan */
  experiencePreferences: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  /** Số giây access token còn hiệu lực */
  expiresIn: number;
  user: ClientUser;
}

export interface ReferenceItem {
  id?: number;
  code: string;
  name: string;
}

/** Nhóm dịch vụ (Lưu trú, Ẩm thực…) cùng các loại con đang hoạt động */
export interface CategoryGroup extends ReferenceItem {
  subtypes: ReferenceItem[];
}

/** dayOfWeek: 1 = Thứ 2 … 7 = Chủ nhật; giờ dạng HH:mm, null khi đóng cửa */
export interface OpeningHour {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  closed: boolean;
}

export interface PlacePrice {
  /** Ví dụ ROOM_NIGHT, TICKET, AVG_MEAL, AVG_DRINK, OTHER */
  priceType: string;
  amount: number;
  currency: string;
  description: string | null;
}

export interface PlaceImage {
  url: string;
  /** Ảnh bìa */
  primary: boolean;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

/** Một dòng trong danh sách địa điểm công khai (GET /api/places) */
export interface PlaceSummary {
  id: number;
  name: string;
  group: ReferenceItem | null;
  category: ReferenceItem | null;
  groups?: ReferenceItem[];
  categories?: (ReferenceItem & { groupCode?: string | null })[];
  province: ReferenceItem | null;
  address: string | null;
  coverUrl: string | null;
  rating: number | null;
  reviewCount: number;
}

/** Chi tiết địa điểm công khai (GET /api/places/{id}) */
export interface PlaceDetail {
  summary: PlaceSummary;
  description: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  openingHours: OpeningHour[];
  prices: PlacePrice[];
  images: PlaceImage[];
}
