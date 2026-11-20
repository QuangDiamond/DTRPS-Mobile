import { clientRequest } from './httpClient';

/** Mirror tối giản của DTRPS-Web/src/client/api/referenceApi.ts — cùng Backend, cùng endpoint. */

export interface ReferenceItem {
  id?: number;
  code: string;
  name: string;
}

/** Nhóm dịch vụ (Lưu trú, Ẩm thực...) cùng các loại con đang hoạt động. */
export interface CategoryGroup extends ReferenceItem {
  subtypes: ReferenceItem[];
}

export const referenceApi = {
  // GET /api/reference/provinces — danh sách tỉnh/thành thật trong DB, dùng để chọn đúng
  // "destination" khi tạo Travel Plan (Backend lọc gợi ý theo đúng tên tỉnh này).
  provinces: () => clientRequest<ReferenceItem[]>('/reference/provinces', { auth: false }),

  // GET /api/reference/categories — nhóm + loại hình con thật trong place_categories, dùng để
  // chọn đúng categoryCodes khi tạo Travel Plan.
  categories: () => clientRequest<CategoryGroup[]>('/reference/categories', { auth: false }),

  // GET /api/reference/special-needs — màn Sở thích du lịch, bước "Yêu cầu đặc biệt".
  specialNeeds: () => clientRequest<ReferenceItem[]>('/reference/special-needs'),
};
