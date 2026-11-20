import type { TripPlan } from './PlanTripScreen';
import type { CreateTravelPlanInput, TravelPace } from '../../services/tripFlowApi';
import { referenceApi, type CategoryGroup } from '../../services/referenceApi';
import { userApi } from '../../services/userApi';
import { EXPERIENCE_TO_CATEGORIES } from '../preferences/experienceQuestions';
import { planDestinations } from '../../constants/planTrip';

/**
 * Chuyển TripPlan (dữ liệu màn Lập kế hoạch, chưa gắn Backend) sang CreateTravelPlanInput thật
 * (POST /travel-plans).
 *
 * categoryCodes giờ lấy đúng theo cách DTRPS-Web/PlanTripPage.tsx thật đang làm (đọc lại hàm đó
 * ngày hôm nay để port chính xác, không suy đoán):
 *   1. Tải sở thích đã lưu (GET /users/me/preferences) + danh mục thật (GET /reference/categories).
 *   2. Nếu người dùng đã trả lời câu 3 "Trải nghiệm nào khiến bạn hào hứng" (experiencePreferences
 *      có mã bắt đầu bằng "EXPERIENCE_") → suy ra categoryCodes qua EXPERIENCE_TO_CATEGORIES.
 *   3. Nếu chưa trả lời gì → dùng thẳng preferences.interests (đây là mã place_categories.code đã
 *      lưu trong hồ sơ, KHÔNG phải mã bảng interests — xem Preference.java).
 *   4. Lọc lại với danh sách category code thật, giới hạn 50 mã.
 * Màn Lập kế hoạch (PlanTripScreen) trên Mobile vẫn còn ô "Sở thích trải nghiệm" riêng
 * (mock, chip bãi biển/ẩm thực/...) nhưng giống Web hiện tại, ô đó KHÔNG còn được dùng để suy ra
 * categoryCodes nữa — chỉ còn là input trang trí, chưa gỡ bỏ (xem MOBILE_WEB_PARITY_PROGRESS.md).
 *
 * destination vẫn đối chiếu với GET /reference/provinces như trước (Web tự chọn tỉnh qua ô chọn
 * điểm đến thật, Mobile chưa có ô đó nên vẫn cần suy đoán + xác thực lại).
 */

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .trim();
}

// Gợi ý tên tỉnh thật gần nhất cho mỗi destinationId mock — dùng để tìm trong danh sách tỉnh
// THẬT (reference/provinces), không gửi thẳng chuỗi này lên Backend.
const DESTINATION_PROVINCE_HINT: Record<string, string> = {
  'da-nang': 'Đà Nẵng',
  'ha-noi': 'Hà Nội',
  'ha-long': 'Quảng Ninh',
  'sa-pa': 'Lào Cai',
  // Kiên Giang (Phú Quốc) không còn là tỉnh riêng sau sáp nhập — gần nhất trong danh sách
  // thật hiện tại là An Giang; vẫn được xác thực lại với danh sách thật bên dưới.
  'phu-quoc': 'An Giang',
};

/**
 * Chọn tỉnh THẬT khớp nhất cho một destinationId mock, trong danh sách `provinces` vừa lấy từ
 * Backend. Thử theo thứ tự: (1) đúng tên gợi ý ở trên, (2) tên tỉnh thật xuất hiện trong nhãn/
 * vùng miền của destination mock, (3) tỉnh đầu tiên trong danh sách thật (phương án cuối, tránh
 * gửi chuỗi không tồn tại trong DB).
 */
export function resolveDestinationName(
  destinationId: string,
  provinces: { code: string; name: string }[],
): string {
  if (provinces.length === 0) return DESTINATION_PROVINCE_HINT[destinationId] ?? destinationId;

  const hint = DESTINATION_PROVINCE_HINT[destinationId];
  if (hint) {
    const exact = provinces.find((p) => normalize(p.name) === normalize(hint));
    if (exact) return exact.name;
  }

  const mock = planDestinations.find((item) => item.id === destinationId);
  const haystack = normalize(`${mock?.label ?? ''} ${mock?.short ?? ''} ${mock?.region ?? ''}`);
  const fuzzy = provinces.find((p) => haystack.includes(normalize(p.name)));
  if (fuzzy) return fuzzy.name;

  return provinces[0].name;
}

/** Port chính xác của PlanTripPage.tsx (Web): suy ra categoryCodes từ sở thích đã lưu. */
export function resolveCategoryCodesFromPreferences(
  categories: CategoryGroup[],
  savedInterests: string[],
  savedExperiencePreferences: string[],
): string[] {
  const validCodes = new Set(categories.flatMap((group) => group.subtypes.map((s) => s.code)));
  const savedCategoryCodes = savedInterests.filter((code) => validCodes.has(code));

  const hasActivityChoice = savedExperiencePreferences.some((code) => code.startsWith('EXPERIENCE_'));
  const compatibleCodes = new Set(
    hasActivityChoice
      ? savedExperiencePreferences.flatMap((code) => EXPERIENCE_TO_CATEGORIES[code] ?? [])
      : savedCategoryCodes,
  );

  const categoryCodes = [
    ...new Set(
      categories.flatMap((group) =>
        group.subtypes.filter((s) => compatibleCodes.has(s.code)).map((s) => s.code),
      ),
    ),
  ];
  return categoryCodes.slice(0, 50);
}

const BUDGET_TOTAL_VND: Record<string, number> = {
  // Khớp với planBudgetOptions.estimate hiển thị trên màn Lập kế hoạch (constants/planTrip.ts):
  saving: 3_500_000, // "~3.500.000 đ"
  standard: 8_000_000, // "~8.000.000 đ"
  luxury: 15_000_000, // "~15.000.000 đ"
};

const PACE_TO_BACKEND: Record<string, TravelPace> = {
  relaxed: 'RELAXED',
  balanced: 'BALANCED',
  packed: 'PACKED',
};

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function tripPlanToCreateInput(plan: TripPlan): Promise<CreateTravelPlanInput> {
  const [provinces, categories, preferences] = await Promise.all([
    referenceApi.provinces(),
    referenceApi.categories(),
    // Sở thích có thể chưa từng được lưu (API lỗi/404 trên tài khoản mới) — không chặn tạo
    // kế hoạch, chỉ coi như chưa có sở thích nào.
    userApi.preferences().catch(() => ({ notes: null, interests: [], specialNeeds: [], experiencePreferences: [] })),
  ]);

  const destination = resolveDestinationName(plan.destinationId, provinces);
  const categoryCodes = resolveCategoryCodesFromPreferences(
    categories,
    preferences.interests,
    preferences.experiencePreferences,
  );
  const endDate = addDays(plan.startDate, plan.days - 1);

  return {
    title: `Chuyến đi ${destination}`,
    destination,
    startDate: toIsoDate(plan.startDate),
    endDate: toIsoDate(endDate),
    budget: BUDGET_TOTAL_VND[plan.budget] ?? null,
    currency: 'VND',
    groupSize: plan.members,
    description: null,
    categoryCodes,
    experiencePreferences: preferences.experiencePreferences,
    travelPace: PACE_TO_BACKEND[plan.pace] ?? 'BALANCED',
  };
}
