import type { IconName } from './places';

// Dữ liệu mẫu cho màn Thêm địa điểm vào lịch trình (chưa có backend)

export type NearbyCategory = 'nearest' | 'food' | 'cafe' | 'culture' | 'nature';

export type NearbyPlace = {
  id: string;
  name: string;
  category: Exclude<NearbyCategory, 'nearest'>;
  categoryLabel: string;
  categoryIcon: IconName;
  /** Khoảng cách tính bằng mét, dùng để sắp xếp "Gần đây nhất" */
  distance: number;
  rating: number;
  reviews: string;
  duration: string;
  price: string;
  note: string;
  image: string;
};

export const nearbyCategories: {
  id: NearbyCategory;
  label: string;
  icon: IconName;
}[] = [
  { id: 'nearest', label: 'Gần đây nhất', icon: 'navigation-variant-outline' },
  { id: 'food', label: 'Ẩm thực', icon: 'silverware-fork-knife' },
  { id: 'cafe', label: 'Cà phê & Chill', icon: 'coffee-outline' },
  { id: 'culture', label: 'Văn hoá', icon: 'bank-outline' },
  { id: 'nature', label: 'Thiên nhiên', icon: 'image-filter-hdr' },
];

export const nearbyPlaces: NearbyPlace[] = [
  {
    id: 'son-tra',
    name: 'Bán đảo Sơn Trà & Chùa Linh Ứng',
    category: 'nature',
    categoryLabel: 'Cảnh quan & Tâm linh',
    categoryIcon: 'image-filter-hdr',
    distance: 2500,
    rating: 4.9,
    reviews: '2.8k',
    duration: '~1.5 - 2h',
    price: 'Miễn phí vé',
    note: 'Đường ven biển thoáng đãng',
    image:
      'https://images.unsplash.com/photo-1573270689103-d7a4e42b609a?w=1200&q=80',
  },
  {
    id: 'helio',
    name: 'Chợ đêm Helio',
    category: 'food',
    categoryLabel: 'Ẩm thực & Âm nhạc',
    categoryIcon: 'food-outline',
    distance: 1800,
    rating: 4.7,
    reviews: '1.9k',
    duration: '~1 - 2h',
    price: '80.000đ - 150.000đ',
    note: 'Náo nhiệt về chiều tối',
    image:
      'https://images.unsplash.com/photo-1555126634-323283e090fa?w=1200&q=80',
  },
  {
    id: 'cham-museum',
    name: 'Bảo tàng Điêu khắc Chăm',
    category: 'culture',
    categoryLabel: 'Di sản văn hoá',
    categoryIcon: 'bank-outline',
    distance: 900,
    rating: 4.8,
    reviews: '1.2k',
    duration: '~1h',
    price: '60.000đ/vé',
    note: 'Ngay gần cầu Rồng',
    image:
      'https://images.unsplash.com/photo-1599708153386-62bf3f035c78?w=1200&q=80',
  },
  {
    id: 'cafe-xua',
    name: 'Cà phê Không Gian Xưa / Trình Cà phê',
    category: 'cafe',
    categoryLabel: 'Check-in & Nghỉ chân',
    categoryIcon: 'coffee-outline',
    distance: 650,
    rating: 4.6,
    reviews: '850',
    duration: '~1h',
    price: '35.000đ - 65.000đ',
    note: 'Thư giãn, cà phê bạc đặc sản',
    image:
      'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=1200&q=80',
  },
  {
    id: 'my-khe-beach',
    name: 'Bãi biển Mỹ Khê',
    category: 'nature',
    categoryLabel: 'Biển & Thể thao nước',
    categoryIcon: 'waves',
    distance: 3200,
    rating: 4.8,
    reviews: '6.4k',
    duration: '~2 - 3h',
    price: 'Miễn phí',
    note: 'Đẹp nhất lúc bình minh',
    image:
      'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=1200&q=80',
  },
  {
    id: 'ngu-hanh-son',
    name: 'Danh thắng Ngũ Hành Sơn',
    category: 'culture',
    categoryLabel: 'Hang động & Chùa cổ',
    categoryIcon: 'temple-buddhist',
    distance: 7800,
    rating: 4.7,
    reviews: '3.1k',
    duration: '~2h',
    price: '40.000đ/vé',
    note: 'Nên đi sáng sớm, tránh nắng',
    image:
      'https://images.unsplash.com/photo-1552055568-f8c4fb8c6320?w=1200&q=80',
  },
];

/** Hiển thị khoảng cách: 900 -> "900m", 2500 -> "2.5 km" */
export const formatDistance = (meters: number) =>
  meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)} km`;
