import { buildQuery, clientRequest } from './http';
import type { Paged, PlaceDetail, PlaceSummary } from './types';

export interface PlaceListParams {
  keyword?: string;
  category?: string;
  province?: string;
  page?: number;
  size?: number;
}

/** Danh sách & chi tiết địa điểm công khai (GET /api/places) — không cần đăng nhập */
export const placesApi = {
  list: ({ keyword, category, province, page = 0, size = 20 }: PlaceListParams) =>
    clientRequest<Paged<PlaceSummary>>(
      `/places?${buildQuery({ page, size, keyword: keyword?.trim(), category, province })}`,
      { auth: false },
    ),

  get: (id: string | number) => clientRequest<PlaceDetail>(`/places/${id}`, { auth: false }),
};
