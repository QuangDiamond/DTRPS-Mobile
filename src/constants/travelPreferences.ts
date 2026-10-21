import type { IconName } from './places';

// Các lựa chọn cho màn Sở thích du lịch (UC-006)

export type TravelPreferences = {
  interests: string[];
  budget: string | null;
  transports: string[];
  style: string | null;
  specialNeeds: string[];
};

export const emptyPreferences: TravelPreferences = {
  interests: [],
  budget: null,
  transports: [],
  style: null,
  specialNeeds: [],
};

export type ImageOption = { id: string; label: string; image: string };

export type IconOption = {
  id: string;
  label: string;
  icon: IconName;
  note?: string;
};

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=600&q=80`;

// Bước 1 – Trải nghiệm (chọn nhiều)
export const interestOptions: ImageOption[] = [
  { id: 'nature', label: 'Thiên nhiên\n& Ngoài trời', image: img('1528127269322-539801943592') },
  { id: 'culture', label: 'Văn hóa\n& Lịch sử', image: img('1559592413-7cec4d0cae2b') },
  { id: 'food', label: 'Ẩm thực', image: img('1555126634-323283e090fa') },
  { id: 'photo', label: 'Chụp ảnh', image: img('1490750967868-88aa4486c946') },
  { id: 'shopping', label: 'Mua sắm', image: img('1583417319070-4a69db38a482') },
  { id: 'nightlife', label: 'Cuộc sống về đêm', image: img('1528181304800-259b08848526') },
];

// Bước 2 – Ngân sách (chọn 1)
export const budgetOptions: IconOption[] = [
  { id: 'saving', label: 'Tiết kiệm', note: 'Dưới 5.000.000đ', icon: 'piggy-bank-outline' },
  { id: 'medium', label: 'Trung bình', note: '5.000.000đ - 15.000.000đ', icon: 'database-outline' },
  { id: 'luxury', label: 'Cao cấp', note: 'Trên 15.000.000đ', icon: 'diamond-stone' },
];

// Bước 3 – Phương tiện (chọn nhiều)
export const transportOptions: IconOption[] = [
  { id: 'plane', label: 'Máy bay', icon: 'airplane' },
  { id: 'train', label: 'Tàu hỏa', icon: 'train' },
  { id: 'bus', label: 'Xe khách', icon: 'bus' },
  { id: 'car', label: 'Ô tô thuê', icon: 'car' },
  { id: 'motorbike', label: 'Xe máy', icon: 'motorbike' },
  { id: 'other', label: 'Khác', icon: 'dots-horizontal' },
];

// Bước 4 – Phong cách (chọn 1)
export const styleOptions: ImageOption[] = [
  { id: 'relax', label: 'Thư giãn', image: img('1506461883276-594a12b11cf3') },
  { id: 'adventure', label: 'Phiêu lưu', image: img('1570366583862-f91883984fde') },
  { id: 'culture', label: 'Khám phá văn hóa', image: img('1540611025311-01df3cef54b5') },
  { id: 'family', label: 'Du lịch gia đình', image: img('1564596823821-79b97151055e') },
  { id: 'solo', label: 'Du lịch một mình', image: img('1509030450996-dd1a26dda07a') },
  { id: 'luxury', label: 'Du lịch cao cấp', image: img('1573270689103-d7a4e42b609a') },
];

// Bước 5 – Yêu cầu đặc biệt (chọn nhiều, không bắt buộc)
export const specialNeedOptions: IconOption[] = [
  { id: 'vegetarian', label: 'Ăn chay', icon: 'leaf' },
  { id: 'diet', label: 'Hạn chế đồ ăn', icon: 'silverware-fork-knife' },
  { id: 'kids', label: 'Phù hợp trẻ em', icon: 'human-child' },
  { id: 'elderly', label: 'Phù hợp người lớn tuổi', icon: 'human-cane' },
  { id: 'pets', label: 'Thân thiện với thú cưng', icon: 'paw' },
  { id: 'other', label: 'Khác', icon: 'dots-horizontal' },
];
