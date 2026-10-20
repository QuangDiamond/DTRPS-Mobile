import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';

// Dữ liệu mẫu dùng chung cho màn Khám phá và Chi tiết địa điểm (chưa có backend)

export type IconName =
  React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export type CategoryId =
  | 'all'
  | 'food'
  | 'culture'
  | 'nature'
  | 'shopping';

export type PlaceTag = {
  label: string;
  icon: IconName;
};

export type PlaceInfoItem = {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  tone: 'blue' | 'orange' | 'green' | 'purple';
};

export type PhotoSpot = {
  name: string;
  subtitle: string;
  image: string;
};

export type Place = {
  id: string;
  name: string;
  location: string;
  address: string;
  tag: string;
  tagIcon: IconName;
  category: CategoryId;
  rating: number;
  reviews: string;
  reviewCount: string;
  description: string;
  priceLabel: string;
  priceNote?: string;
  image: string;

  // ---- Chi tiết ----
  badge?: string;
  rank: string;
  tags: PlaceTag[];
  weather: {
    temperature: number;
    condition: string;
    icon: IconName;
    status: string;
    extraLabel: string;
    extraValue: string;
  };
  intro: string;
  info: PlaceInfoItem[];
  photoSpots: PhotoSpot[];
  map: {
    distance: string;
    landmark: string;
  };
};

export const places: Place[] = [
  {
    id: 'ha-long',
    name: 'Vịnh Hạ Long',
    location: 'Quảng Ninh',
    address: 'Thành phố Hạ Long, Tỉnh Quảng Ninh, Việt Nam',
    tag: 'Thiên nhiên & Vịnh biển',
    tagIcon: 'waves',
    category: 'nature',
    rating: 4.9,
    reviews: '3.2k',
    reviewCount: '12,450',
    description:
      'Kỳ quan thiên nhiên thế giới với hàng ngàn đảo đá vôi kỳ vĩ rực rỡ sắc xanh lam ngọc bích giữa vịnh biển Đông Bắc.',
    priceLabel: 'Từ 350.000đ',
    priceNote: '/người',
    image:
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80',
    badge: 'UNESCO World Heritage',
    rank: 'Top 1 Miền Bắc',
    tags: [
      { label: 'Thiên nhiên kỳ vĩ', icon: 'image-filter-hdr' },
      { label: 'Di sản UNESCO', icon: 'bank-outline' },
      { label: 'Du thuyền sang trọng', icon: 'sail-boat' },
    ],
    weather: {
      temperature: 26,
      condition: 'Trời nắng nhẹ, biển êm',
      icon: 'weather-partly-cloudy',
      status: 'Lý tưởng hôm nay',
      extraLabel: 'Tầm nhìn xa',
      extraValue: '> 10 km',
    },
    intro:
      'Vịnh Hạ Long là kiệt tác thiên nhiên với gần 2.000 hòn đảo đá vôi nhô lên sừng sững giữa làn nước ngọc bích phẳng lặng. Du khách sẽ được chiêm ngưỡng hệ thống hang động kỳ ảo, chèo kayak qua những làng chài nổi và ngắm hoàng hôn tuyệt đẹp trên boong du thuyền. Đây là điểm đến không thể bỏ lỡ trong hành trình khám phá miền Bắc Việt Nam.',
    info: [
      { label: 'Giờ mở cửa', value: '06:30 - 18:30', note: 'Hàng ngày', icon: 'clock-outline', tone: 'blue' },
      { label: 'Vé tham quan', value: '290k - 340k', note: 'Tùy tuyến hành trình', icon: 'ticket-outline', tone: 'orange' },
      { label: 'Thời gian gợi ý', value: '4 - 6 giờ', note: 'Hoặc tour 2N1Đ', icon: 'timer-sand', tone: 'green' },
      { label: 'Dịch vụ nổi bật', value: 'Kayak & Cruise', note: 'Bao gồm hướng dẫn', icon: 'kayaking', tone: 'purple' },
    ],
    photoSpots: [
      {
        name: 'Động Thiên Cung',
        subtitle: 'Hang động thạch nhũ',
        image: 'https://images.unsplash.com/photo-1552055568-f8c4fb8c6320?w=600&q=80',
      },
      {
        name: 'Đảo Ti Tốp',
        subtitle: 'Bãi tắm & đỉnh vọng cảnh',
        image: 'https://images.unsplash.com/photo-1573270689103-d7a4e42b609a?w=600&q=80',
      },
      {
        name: 'Hòn Trống Mái',
        subtitle: 'Biểu tượng của vịnh',
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80',
      },
      {
        name: 'Làng chài Cửa Vạn',
        subtitle: 'Làng nổi trên biển',
        image: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=600&q=80',
      },
    ],
    map: {
      distance: 'Cách trung tâm 12km',
      landmark: 'Cảng Quốc Tế Tuần Châu',
    },
  },
  {
    id: 'hoi-an',
    name: 'Phố cổ Hội An',
    location: 'Quảng Nam',
    address: 'Thành phố Hội An, Tỉnh Quảng Nam, Việt Nam',
    tag: 'Di sản & Văn hoá',
    tagIcon: 'bank-outline',
    category: 'culture',
    rating: 4.8,
    reviews: '4.1k',
    reviewCount: '18,320',
    description:
      'Đô thị cổ trầm mặc bên dòng sông Hoài với ngôi nhà rêu phong, lồng đèn thủ công rực rỡ về đêm và ẩm thực đặc sắc.',
    priceLabel: 'Miễn phí',
    priceNote: ' (vé di sản 120k)',
    image:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=80',
    badge: 'UNESCO World Heritage',
    rank: 'Top 1 Miền Trung',
    tags: [
      { label: 'Phố cổ đèn lồng', icon: 'lightbulb-group-outline' },
      { label: 'Di sản UNESCO', icon: 'bank-outline' },
      { label: 'Ẩm thực đường phố', icon: 'food-outline' },
    ],
    weather: {
      temperature: 29,
      condition: 'Nắng ấm, gió nhẹ',
      icon: 'weather-sunny',
      status: 'Đẹp về chiều tối',
      extraLabel: 'Độ ẩm',
      extraValue: '72%',
    },
    intro:
      'Hội An từng là thương cảng sầm uất bậc nhất Đông Nam Á thế kỷ XVI - XVII. Ngày nay phố cổ vẫn giữ nguyên hơn 1.000 di tích kiến trúc với những ngôi nhà gỗ, hội quán và chùa Cầu nổi tiếng. Khi đêm xuống, hàng ngàn chiếc đèn lồng lung linh cùng hoạt động thả hoa đăng trên sông Hoài tạo nên khung cảnh lãng mạn khó quên.',
    info: [
      { label: 'Giờ mở cửa', value: 'Cả ngày', note: 'Phố đi bộ từ 15:00', icon: 'clock-outline', tone: 'blue' },
      { label: 'Vé tham quan', value: '120k', note: 'Vé 5 điểm di tích', icon: 'ticket-outline', tone: 'orange' },
      { label: 'Thời gian gợi ý', value: '1 - 2 ngày', note: 'Nên ở lại buổi tối', icon: 'timer-sand', tone: 'green' },
      { label: 'Dịch vụ nổi bật', value: 'Thả đèn hoa đăng', note: 'Thuyền sông Hoài', icon: 'candle', tone: 'purple' },
    ],
    photoSpots: [
      {
        name: 'Chùa Cầu',
        subtitle: 'Biểu tượng phố cổ',
        image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
      },
      {
        name: 'Sông Hoài về đêm',
        subtitle: 'Thả hoa đăng',
        image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
      },
      {
        name: 'Phố đèn lồng',
        subtitle: 'Check-in rực rỡ',
        image: 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=600&q=80',
      },
    ],
    map: {
      distance: 'Cách Đà Nẵng 30km',
      landmark: 'Chùa Cầu Hội An',
    },
  },
  {
    id: 'ben-thanh',
    name: 'Chợ Bến Thành & Phố ẩm thực',
    location: 'TP. Hồ Chí Minh',
    address: 'Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    tag: 'Ẩm thực & Mua sắm',
    tagIcon: 'food-outline',
    category: 'food',
    rating: 4.7,
    reviews: '2.5k',
    reviewCount: '9,870',
    description:
      'Biểu tượng lịch sử nhộn nhịp của Sài Gòn quy tụ hàng trăm món ăn đường phố đậm đà và đặc sản quà tặng.',
    priceLabel: 'Từ 50.000đ',
    priceNote: '/món',
    image:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=80',
    badge: 'Biểu tượng Sài Gòn',
    rank: 'Top 1 Miền Nam',
    tags: [
      { label: 'Ẩm thực đường phố', icon: 'food-outline' },
      { label: 'Chợ đêm', icon: 'weather-night' },
      { label: 'Mua sắm quà tặng', icon: 'shopping-outline' },
    ],
    weather: {
      temperature: 32,
      condition: 'Nắng nóng, có mây',
      icon: 'weather-partly-cloudy',
      status: 'Đẹp từ 17:00',
      extraLabel: 'Chỉ số UV',
      extraValue: 'Cao (8)',
    },
    intro:
      'Chợ Bến Thành hơn 100 năm tuổi là trái tim của Quận 1 với tháp đồng hồ cổ kính. Bên trong là thiên đường ẩm thực từ cơm tấm, bánh xèo đến chè Sài Gòn, cùng các gian hàng vải vóc, cà phê và đặc sản. Buổi tối, khu chợ đêm xung quanh càng thêm náo nhiệt với hải sản nướng và quầy lưu niệm.',
    info: [
      { label: 'Giờ mở cửa', value: '06:00 - 22:00', note: 'Chợ đêm đến 24:00', icon: 'clock-outline', tone: 'blue' },
      { label: 'Vé tham quan', value: 'Miễn phí', note: 'Món ăn từ 50k', icon: 'ticket-outline', tone: 'orange' },
      { label: 'Thời gian gợi ý', value: '2 - 3 giờ', note: 'Buổi chiều tối', icon: 'timer-sand', tone: 'green' },
      { label: 'Dịch vụ nổi bật', value: 'Food Tour', note: 'Có hướng dẫn viên', icon: 'silverware-fork-knife', tone: 'purple' },
    ],
    photoSpots: [
      {
        name: 'Cổng chợ Nam',
        subtitle: 'Tháp đồng hồ cổ',
        image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',
      },
      {
        name: 'Khu ẩm thực',
        subtitle: 'Hàng trăm món ngon',
        image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&q=80',
      },
      {
        name: 'Phố đi bộ Nguyễn Huệ',
        subtitle: 'Cách 500m',
        image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&q=80',
      },
    ],
    map: {
      distance: 'Ngay trung tâm Quận 1',
      landmark: 'Chợ Bến Thành',
    },
  },
  {
    id: 'ba-na',
    name: 'Bà Nà Hills & Cầu Vàng',
    location: 'Đà Nẵng',
    address: 'Hòa Ninh, Huyện Hòa Vang, Thành phố Đà Nẵng',
    tag: 'Giải trí & Cảnh quan',
    tagIcon: 'ferris-wheel',
    category: 'nature',
    rating: 4.8,
    reviews: '5.6k',
    reviewCount: '21,040',
    description:
      'Cây cầu Vàng nổi danh thế giới giữa đỉnh núi mờ sương cùng hệ thống cáp treo kỷ lục và làng Pháp cổ kính.',
    priceLabel: '850.000đ',
    priceNote: '/vé cáp treo',
    image:
      'https://images.unsplash.com/photo-1564596823821-79b97151055e?w=1200&q=80',
    badge: 'Kỷ lục cáp treo',
    rank: 'Top 2 Miền Trung',
    tags: [
      { label: 'Cầu Vàng', icon: 'bridge' },
      { label: 'Làng Pháp', icon: 'castle' },
      { label: 'Khu vui chơi', icon: 'ferris-wheel' },
    ],
    weather: {
      temperature: 19,
      condition: 'Mát mẻ, sương nhẹ',
      icon: 'weather-fog',
      status: 'Nên đi buổi sáng',
      extraLabel: 'Độ cao',
      extraValue: '1.487 m',
    },
    intro:
      'Nằm trên đỉnh núi Chúa ở độ cao gần 1.500m, Bà Nà Hills mang khí hậu bốn mùa trong một ngày. Cầu Vàng với đôi bàn tay khổng lồ nâng đỡ đã trở thành biểu tượng du lịch Việt Nam trên báo chí quốc tế. Du khách còn có thể dạo Làng Pháp, vườn hoa Le Jardin D’Amour và khu vui chơi Fantasy Park.',
    info: [
      { label: 'Giờ mở cửa', value: '07:00 - 22:00', note: 'Cáp treo đến 17:30', icon: 'clock-outline', tone: 'blue' },
      { label: 'Vé tham quan', value: '850k - 950k', note: 'Đã gồm cáp treo', icon: 'ticket-outline', tone: 'orange' },
      { label: 'Thời gian gợi ý', value: '1 ngày', note: 'Đi sớm tránh đông', icon: 'timer-sand', tone: 'green' },
      { label: 'Dịch vụ nổi bật', value: 'Cáp treo', note: 'Dài 5.801m', icon: 'gondola', tone: 'purple' },
    ],
    photoSpots: [
      {
        name: 'Cầu Vàng',
        subtitle: 'Bàn tay khổng lồ',
        image: 'https://images.unsplash.com/photo-1564596823821-79b97151055e?w=600&q=80',
      },
      {
        name: 'Làng Pháp',
        subtitle: 'Kiến trúc châu Âu',
        image: 'https://images.unsplash.com/photo-1599708153386-62bf3f035c78?w=600&q=80',
      },
      {
        name: 'Vườn hoa Le Jardin',
        subtitle: 'Vườn hoa tình yêu',
        image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&q=80',
      },
    ],
    map: {
      distance: 'Cách trung tâm 25km',
      landmark: 'Ga cáp treo Suối Mơ',
    },
  },
  {
    id: 'mu-cang-chai',
    name: 'Thung lũng Mường Hoa',
    location: 'Sa Pa, Lào Cai',
    address: 'Thị xã Sa Pa, Tỉnh Lào Cai, Việt Nam',
    tag: 'Phiêu lưu & Khám phá bản làng',
    tagIcon: 'hiking',
    category: 'nature',
    rating: 4.8,
    reviews: '1.9k',
    reviewCount: '7,560',
    description:
      'Tuyệt tác ruộng bậc thang uốn lượn theo sườn đồi Hoàng Liên Sơn, đồng suối trong veo và nét văn hoá người H’Mông.',
    priceLabel: '80.000đ',
    priceNote: '/vé vào bản',
    image:
      'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=1200&q=80',
    badge: 'Ruộng bậc thang đẹp nhất',
    rank: 'Top 3 Miền Bắc',
    tags: [
      { label: 'Trekking', icon: 'hiking' },
      { label: 'Ruộng bậc thang', icon: 'sprout-outline' },
      { label: 'Văn hoá bản địa', icon: 'account-group-outline' },
    ],
    weather: {
      temperature: 17,
      condition: 'Se lạnh, trời quang',
      icon: 'weather-sunny',
      status: 'Lý tưởng trekking',
      extraLabel: 'Tầm nhìn xa',
      extraValue: '> 8 km',
    },
    intro:
      'Thung lũng Mường Hoa trải dài hơn 15km dưới chân dãy Hoàng Liên Sơn với những thửa ruộng bậc thang nối tiếp nhau như những nấc thang lên trời. Con đường trekking đi qua các bản Lao Chải, Tả Van của người H’Mông và Giáy, bãi đá cổ khắc chữ bí ẩn và dòng suối Mường Hoa trong vắt.',
    info: [
      { label: 'Giờ mở cửa', value: 'Cả ngày', note: 'Nên đi từ 07:00', icon: 'clock-outline', tone: 'blue' },
      { label: 'Vé tham quan', value: '80k', note: 'Vé vào bản', icon: 'ticket-outline', tone: 'orange' },
      { label: 'Thời gian gợi ý', value: '1 - 2 ngày', note: 'Ngủ homestay bản', icon: 'timer-sand', tone: 'green' },
      { label: 'Dịch vụ nổi bật', value: 'Trekking', note: 'Có porter địa phương', icon: 'hiking', tone: 'purple' },
    ],
    photoSpots: [
      {
        name: 'Bản Lao Chải',
        subtitle: 'Làng người H’Mông',
        image: 'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=600&q=80',
      },
      {
        name: 'Bản Tả Van',
        subtitle: 'Homestay giữa ruộng',
        image: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=600&q=80',
      },
      {
        name: 'Bãi đá cổ',
        subtitle: 'Di tích chữ khắc cổ',
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80',
      },
    ],
    map: {
      distance: 'Cách thị trấn Sa Pa 8km',
      landmark: 'Bản Lao Chải',
    },
  },
];

export const getPlaceById = (id: string) =>
  places.find((place) => place.id === id);
