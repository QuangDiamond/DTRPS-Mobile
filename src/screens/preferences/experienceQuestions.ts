import type { IconName } from '../../constants/places';

/**
 * Port nguyên nội dung thật từ DTRPS-Web/src/client/traveller/data/planTrip.ts
 * (EXPERIENCE_QUESTIONS, EXPERIENCE_TO_CATEGORIES) — cùng bộ mã với Backend
 * (TravelPlanService.EXPERIENCE_CODES / PreferenceService.EXPERIENCE_CODES). Đây là nội dung
 * sản phẩm tĩnh (câu hỏi cá nhân hóa), không phải dữ liệu suy đoán.
 */

export interface ExperienceQuestionOption {
  code: string;
  emoji: string;
  label: string;
}

export interface ExperienceQuestion {
  id: string;
  icon: IconName;
  title: string;
  subtitle: string;
  options: ExperienceQuestionOption[];
}

export const EXPERIENCE_QUESTIONS: ExperienceQuestion[] = [
  {
    id: 'purpose',
    icon: 'heart',
    title: 'Bạn mong muốn điều gì từ chuyến đi này?',
    subtitle: 'Chọn cảm xúc hoặc mục đích bạn hướng đến.',
    options: [
      { code: 'PURPOSE_RELAX', emoji: '🌿', label: 'Thư giãn & chữa lành' },
      { code: 'PURPOSE_ADVENTURE', emoji: '🧭', label: 'Khám phá & phiêu lưu' },
      { code: 'PURPOSE_BOND', emoji: '💗', label: 'Gắn kết người thân' },
      { code: 'PURPOSE_FUN', emoji: '🎉', label: 'Vui chơi & giải trí' },
      { code: 'PURPOSE_CULTURE', emoji: '🏛️', label: 'Tìm hiểu văn hóa' },
      { code: 'PURPOSE_ROMANCE', emoji: '🌅', label: 'Tạo kỷ niệm lãng mạn' },
    ],
  },
  {
    id: 'style',
    icon: 'compass-outline',
    title: 'Bạn thích du lịch theo phong cách nào?',
    subtitle: 'Hãy chọn cách bạn thích tận hưởng hành trình.',
    options: [
      { code: 'STYLE_QUIET', emoji: '🍃', label: 'Yên tĩnh, nhẹ nhàng' },
      { code: 'STYLE_ACTIVE', emoji: '⚡', label: 'Năng động, sôi nổi' },
      { code: 'STYLE_FREE', emoji: '✨', label: 'Tự do, ngẫu hứng' },
      { code: 'STYLE_PLANNED', emoji: '📋', label: 'Có kế hoạch rõ ràng' },
      { code: 'STYLE_COMFORT', emoji: '💎', label: 'Thoải mái, tiện nghi' },
      { code: 'STYLE_LOCAL', emoji: '🎒', label: 'Gần gũi địa phương' },
    ],
  },
  {
    id: 'experience',
    icon: 'star-four-points-outline',
    title: 'Trải nghiệm nào khiến bạn hào hứng?',
    subtitle: 'Chọn những hoạt động mà bạn thực sự muốn thử.',
    options: [
      { code: 'EXPERIENCE_NATURE', emoji: '🏞️', label: 'Khám phá thiên nhiên' },
      { code: 'EXPERIENCE_FOOD', emoji: '🍜', label: 'Thưởng thức ẩm thực' },
      { code: 'EXPERIENCE_PHOTO', emoji: '📸', label: 'Chụp ảnh, check-in' },
      { code: 'EXPERIENCE_OUTDOOR', emoji: '🚣', label: 'Hoạt động ngoài trời' },
      { code: 'EXPERIENCE_ART_CULTURE', emoji: '🎨', label: 'Nghệ thuật & văn hóa' },
      { code: 'EXPERIENCE_WELLNESS', emoji: '🧘', label: 'Nghỉ dưỡng & chăm sóc' },
    ],
  },
  {
    id: 'memory',
    icon: 'image-multiple-outline',
    title: 'Bạn muốn mang điều gì về sau chuyến đi?',
    subtitle: 'Điều khiến một chuyến đi trở nên đáng nhớ.',
    options: [
      { code: 'MEMORY_PHOTOS', emoji: '📷', label: 'Những bức ảnh đẹp' },
      { code: 'MEMORY_STORIES', emoji: '📖', label: 'Câu chuyện & kiến thức' },
      { code: 'MEMORY_UNFORGETTABLE', emoji: '💫', label: 'Trải nghiệm khó quên' },
      { code: 'MEMORY_TOGETHER', emoji: '🤝', label: 'Kỷ niệm cùng mọi người' },
    ],
  },
];

/** Chỉ ánh xạ các hoạt động cụ thể ở câu 3. Không suy diễn mục đích/phong cách thành danh mục. */
export const EXPERIENCE_TO_CATEGORIES: Record<string, readonly string[]> = {
  EXPERIENCE_NATURE: ['park', 'scenicSpot', 'beach'],
  EXPERIENCE_FOOD: ['restaurant', 'localEatery', 'cafe'],
  EXPERIENCE_PHOTO: ['checkinSpot', 'scenicSpot'],
  EXPERIENCE_OUTDOOR: ['park', 'scenicSpot', 'amusementPark', 'beach'],
  EXPERIENCE_ART_CULTURE: ['heritage', 'craftVillage'],
  EXPERIENCE_WELLNESS: ['resort'],
};
