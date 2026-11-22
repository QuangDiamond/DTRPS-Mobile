import { clientRequest } from './http';

/** Địa điểm đối tác đang chạy quảng cáo (khu "Đối tác nổi bật" ở trang chủ) */
export interface FeaturedPlace {
  id: number;
  name: string;
  category: string | null;
  province: string | null;
  coverUrl: string | null;
  rating: number | null;
  reviewCount: number;
}

export const adApi = {
  /** Công khai: địa điểm được tài trợ ở trang chủ */
  featured: (limit = 8) =>
    clientRequest<FeaturedPlace[]>(`/featured-places?limit=${limit}`, { auth: false }),
};
