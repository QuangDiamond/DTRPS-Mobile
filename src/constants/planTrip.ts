import type { IconName } from './places';

// Dữ liệu mẫu cho màn Lập kế hoạch chuyến đi (chưa có backend)

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1200&q=80`;

export type PlanDestination = {
  id: string;
  label: string;
  /** Tên ngắn hiển thị trên chip */
  short: string;
  image: string;
  highlights: string;
  // ---- Dùng cho màn Đang tạo chuyến đi ----
  region: string;
  previewTitle: string;
  previewSubtitle: string;
  tipPlace: string;
  tip: string;
};

export const planDestinations: PlanDestination[] = [
  {
    id: 'da-nang',
    label: 'Đà Nẵng - Hội An (Quảng Nam)',
    short: 'Đà Nẵng - Hội An',
    image: img('1564596823821-79b97151055e'),
    highlights: 'Cầu Vàng Bà Nà • Phố cổ Hội An • Bán đảo Sơn Trà',
    region: 'Miền Trung',
    previewTitle: 'Phố Cổ Hội An & Bán Đảo Sơn Trà',
    previewSubtitle: 'Thưởng lãm kiến trúc cổ kính và ẩm thực xứ Quảng',
    tipPlace: 'Hội An',
    tip: 'Buổi chiều từ 16:30 là thời điểm lý tưởng nhất để tản bộ ngắm phố đèn lồng và đi thuyền ngắm hoàng hôn trên dòng sông Hoài.',
  },
  {
    id: 'ha-noi',
    label: 'Hà Nội',
    short: 'Hà Nội',
    image: img('1508804185872-d7badad00f7d'),
    highlights: 'Hồ Gươm • Phố cổ 36 phố phường • Văn Miếu',
    region: 'Miền Bắc',
    previewTitle: 'Phố Cổ Hà Nội & Hồ Hoàn Kiếm',
    previewSubtitle: 'Nghìn năm văn hiến giữa lòng thủ đô',
    tipPlace: 'Hà Nội',
    tip: 'Cuối tuần phố đi bộ Hồ Gươm cấm xe từ 19:00, rất hợp để dạo bộ và thưởng thức kem Tràng Tiền.',
  },
  {
    id: 'ha-long',
    label: 'Vịnh Hạ Long (Quảng Ninh)',
    short: 'Vịnh Hạ Long',
    image: img('1528127269322-539801943592'),
    highlights: 'Du thuyền ngủ đêm • Hang Sửng Sốt • Đảo Ti Tốp',
    region: 'Miền Bắc',
    previewTitle: 'Du Thuyền Vịnh Hạ Long',
    previewSubtitle: 'Ngủ đêm giữa kỳ quan thiên nhiên thế giới',
    tipPlace: 'Hạ Long',
    tip: 'Nên đặt du thuyền khởi hành trước 12:00 để kịp chèo kayak và ngắm hoàng hôn trên vịnh.',
  },
  {
    id: 'sa-pa',
    label: 'Sa Pa (Lào Cai)',
    short: 'Sa Pa',
    image: img('1570366583862-f91883984fde'),
    highlights: 'Fansipan • Bản Cát Cát • Thung lũng Mường Hoa',
    region: 'Tây Bắc',
    previewTitle: 'Săn Mây Sa Pa & Bản Cát Cát',
    previewSubtitle: 'Ruộng bậc thang và văn hoá vùng cao',
    tipPlace: 'Sa Pa',
    tip: 'Sáng sớm 5:30–7:00 là lúc dễ săn mây nhất, nhớ mang áo ấm vì nhiệt độ có thể xuống dưới 10°C.',
  },
  {
    id: 'phu-quoc',
    label: 'Phú Quốc (Kiên Giang)',
    short: 'Phú Quốc',
    image: img('1506461883276-594a12b11cf3'),
    highlights: 'Bãi Sao • Cáp treo Hòn Thơm • Chợ đêm Dinh Cậu',
    region: 'Miền Nam',
    previewTitle: 'Đảo Ngọc Phú Quốc',
    previewSubtitle: 'Biển xanh, cát trắng và hải sản tươi ngon',
    tipPlace: 'Phú Quốc',
    tip: 'Mùa khô (tháng 11–4) biển êm nhất; ghé Sunset Town lúc 17:30 để ngắm hoàng hôn đẹp nhất đảo.',
  },
];

export type CompanionId = 'solo' | 'couple' | 'family' | 'friends';

export const companionOptions: {
  id: CompanionId;
  label: string;
  note: string;
  icon: IconName;
  defaultCount: number;
}[] = [
  { id: 'solo', label: 'Solo', note: '1 người', icon: 'account-outline', defaultCount: 1 },
  { id: 'couple', label: 'Cặp đôi', note: '2 người lớn', icon: 'heart', defaultCount: 2 },
  { id: 'family', label: 'Gia đình', note: 'Có trẻ nhỏ', icon: 'human-male-female-child', defaultCount: 4 },
  { id: 'friends', label: 'Nhóm bạn', note: '3+ người', icon: 'account-group-outline', defaultCount: 4 },
];

export type BudgetId = 'saving' | 'standard' | 'luxury';

export const planBudgetOptions: {
  id: BudgetId;
  label: string;
  note: string;
  estimate: string;
}[] = [
  { id: 'saving', label: 'Tiết kiệm', note: '< 5 triệu', estimate: '~3.500.000 đ' },
  { id: 'standard', label: 'Tiêu chuẩn', note: '5tr - 12tr', estimate: '~8.000.000 đ' },
  { id: 'luxury', label: 'Sang trọng', note: '> 12 triệu', estimate: '~15.000.000 đ' },
];

export const planInterestOptions: { id: string; label: string; icon: IconName }[] = [
  { id: 'beach', label: 'Bãi biển', icon: 'beach' },
  { id: 'food', label: 'Ẩm thực', icon: 'food-outline' },
  { id: 'culture', label: 'Văn hóa & Di sản', icon: 'bank-outline' },
  { id: 'nature', label: 'Thiên nhiên & Sinh thái', icon: 'pine-tree' },
  { id: 'shopping', label: 'Mua sắm & Chợ đêm', icon: 'shopping-outline' },
  { id: 'adventure', label: 'Phiêu lưu & Khám phá', icon: 'hiking' },
  { id: 'relax', label: 'Nghỉ dưỡng & Spa', icon: 'spa-outline' },
];

export type PaceId = 'relaxed' | 'balanced' | 'packed';

export const paceOptions: {
  id: PaceId;
  label: string;
  english: string;
  perDay: string;
  description: string;
}[] = [
  {
    id: 'relaxed',
    label: 'Thư giãn',
    english: 'Relaxed',
    perDay: '2-3 điểm/ngày',
    description: 'Thong thả tận hưởng, không hối hả, nhiều thời gian tự do cafe ngắm cảnh.',
  },
  {
    id: 'balanced',
    label: 'Cân bằng',
    english: 'Balanced',
    perDay: '3-4 điểm/ngày',
    description: 'Hài hòa giữa nghỉ ngơi, ẩm thực và tham quan các địa danh tiêu biểu.',
  },
  {
    id: 'packed',
    label: 'Khám phá tối đa',
    english: 'Packed',
    perDay: '5-6 điểm/ngày',
    description: 'Trải nghiệm phong phú, tận dụng trọn vẹn từng khoảnh khắc trong ngày.',
  },
];
