// Dữ liệu mẫu cho màn Gợi ý điểm đến (chưa có backend / AI thật)
// Mỗi điểm đến lớn (planDestinations) có vài địa điểm nên ghé.

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1200&q=80`;

const IMAGES = {
  goldenBridge: img('1564596823821-79b97151055e'),
  hoiAn: img('1559592413-7cec4d0cae2b'),
  island: img('1573270689103-d7a4e42b609a'),
  streetFood: img('1555126634-323283e090fa'),
  frenchVillage: img('1599708153386-62bf3f035c78'),
  lanterns: img('1540611025311-01df3cef54b5'),
  fishingVillage: img('1506461883276-594a12b11cf3'),
  cave: img('1552055568-f8c4fb8c6320'),
  haLong: img('1528127269322-539801943592'),
  riverNight: img('1528181304800-259b08848526'),
  flowers: img('1490750967868-88aa4486c946'),
  market: img('1583417319070-4a69db38a482'),
  walkingStreet: img('1508804185872-d7badad00f7d'),
  sapa: img('1570366583862-f91883984fde'),
  village: img('1509030450996-dd1a26dda07a'),
};

export type SuggestionCategory = 'nature' | 'culture' | 'food' | 'beach' | 'entertainment';

export const suggestionCategoryLabels: Record<SuggestionCategory, string> = {
  nature: 'Thiên nhiên',
  culture: 'Văn hóa',
  food: 'Ẩm thực',
  beach: 'Biển đảo',
  entertainment: 'Vui chơi',
};

/** Id trùng với planInterestOptions để tính độ phù hợp */
export type InterestTag = 'beach' | 'food' | 'culture' | 'nature' | 'shopping' | 'adventure' | 'relax';

export const interestTagLabels: Record<InterestTag, string> = {
  beach: 'Bãi biển',
  food: 'Ẩm thực',
  culture: 'Văn hóa',
  nature: 'Thiên nhiên',
  shopping: 'Mua sắm',
  adventure: 'Khám phá',
  relax: 'Nghỉ dưỡng',
};

export type SuggestedPlace = {
  id: string;
  destinationId: string;
  name: string;
  location: string;
  category: SuggestionCategory;
  tags: InterestTag[];
  /** Độ phù hợp gốc, cộng thêm khi trùng sở thích */
  baseMatch: number;
  image: string;
  description: string;
  highlights: { name: string; image: string }[];
  info: {
    openHours: string;
    price: string;
    duration: string;
    bestTime: string;
  };
};

export const suggestedPlaces: SuggestedPlace[] = [
  // ==================== ĐÀ NẴNG - HỘI AN ====================
  {
    id: 'pho-co-hoi-an',
    destinationId: 'da-nang',
    name: 'Phố cổ Hội An',
    location: 'Hội An, Quảng Nam',
    category: 'culture',
    tags: ['culture', 'food', 'shopping'],
    baseMatch: 86,
    image: IMAGES.hoiAn,
    description:
      'Đô thị cổ được UNESCO công nhận với những dãy nhà tường vàng, mái ngói rêu phong và đèn lồng rực rỡ. Buổi tối bạn có thể thả hoa đăng trên sông Hoài và thưởng thức cao lầu, bánh mì Phượng.',
    highlights: [
      { name: 'Chùa Cầu', image: IMAGES.hoiAn },
      { name: 'Phố đèn lồng', image: IMAGES.lanterns },
      { name: 'Sông Hoài về đêm', image: IMAGES.riverNight },
    ],
    info: {
      openHours: 'Cả ngày (phố đi bộ từ 15:00)',
      price: 'Vé tham quan 120.000đ',
      duration: '4 - 5 giờ',
      bestTime: 'Chiều tối 16:30 - 21:00',
    },
  },
  {
    id: 'ba-na-hills',
    destinationId: 'da-nang',
    name: 'Bà Nà Hills & Cầu Vàng',
    location: 'Hòa Vang, Đà Nẵng',
    category: 'entertainment',
    tags: ['nature', 'adventure', 'relax'],
    baseMatch: 84,
    image: IMAGES.goldenBridge,
    description:
      'Khu du lịch trên đỉnh núi Chúa với Cầu Vàng nổi tiếng được nâng đỡ bởi đôi bàn tay khổng lồ. Đi cáp treo xuyên mây, dạo Làng Pháp và vui chơi tại Fantasy Park.',
    highlights: [
      { name: 'Cầu Vàng', image: IMAGES.goldenBridge },
      { name: 'Làng Pháp', image: IMAGES.frenchVillage },
      { name: 'Vườn hoa Le Jardin', image: IMAGES.flowers },
    ],
    info: {
      openHours: '08:00 - 17:00',
      price: '900.000đ (gồm cáp treo)',
      duration: 'Cả ngày',
      bestTime: 'Sáng sớm, tháng 3 - 8',
    },
  },
  {
    id: 'son-tra',
    destinationId: 'da-nang',
    name: 'Bán đảo Sơn Trà',
    location: 'Sơn Trà, Đà Nẵng',
    category: 'nature',
    tags: ['nature', 'adventure', 'beach'],
    baseMatch: 80,
    image: IMAGES.island,
    description:
      'Lá phổi xanh của Đà Nẵng với rừng nguyên sinh, voọc chà vá chân nâu và cung đường ven biển tuyệt đẹp. Ghé chùa Linh Ứng với tượng Quan Âm cao 67m nhìn ra vịnh.',
    highlights: [
      { name: 'Chùa Linh Ứng', image: IMAGES.island },
      { name: 'Đỉnh Bàn Cờ', image: IMAGES.haLong },
      { name: 'Bãi Bụt', image: IMAGES.fishingVillage },
    ],
    info: {
      openHours: 'Cả ngày',
      price: 'Miễn phí',
      duration: '2 - 3 giờ',
      bestTime: 'Sáng sớm hoặc hoàng hôn',
    },
  },
  {
    id: 'cho-dem-helio',
    destinationId: 'da-nang',
    name: 'Chợ đêm Helio & Sơn Trà',
    location: 'Hải Châu, Đà Nẵng',
    category: 'food',
    tags: ['food', 'shopping'],
    baseMatch: 76,
    image: IMAGES.streetFood,
    description:
      'Thiên đường ẩm thực đường phố về đêm với hàng trăm món đặc sản miền Trung: mì Quảng, bánh tráng cuốn thịt heo, hải sản nướng cùng âm nhạc đường phố sôi động.',
    highlights: [
      { name: 'Khu ẩm thực', image: IMAGES.streetFood },
      { name: 'Gian hàng lưu niệm', image: IMAGES.market },
      { name: 'Sân khấu đường phố', image: IMAGES.walkingStreet },
    ],
    info: {
      openHours: '17:00 - 23:00',
      price: '50.000đ - 150.000đ/người',
      duration: '1 - 2 giờ',
      bestTime: 'Tối cuối tuần',
    },
  },

  // ==================== HÀ NỘI ====================
  {
    id: 'ho-guom',
    destinationId: 'ha-noi',
    name: 'Hồ Gươm & Phố đi bộ',
    location: 'Hoàn Kiếm, Hà Nội',
    category: 'culture',
    tags: ['culture', 'relax', 'shopping'],
    baseMatch: 86,
    image: IMAGES.walkingStreet,
    description:
      'Trái tim của thủ đô với Tháp Rùa, cầu Thê Húc và đền Ngọc Sơn. Cuối tuần, khu phố quanh hồ thành phố đi bộ với nhiều hoạt động văn hóa và trò chơi dân gian.',
    highlights: [
      { name: 'Cầu Thê Húc', image: IMAGES.walkingStreet },
      { name: 'Đền Ngọc Sơn', image: IMAGES.lanterns },
      { name: 'Phố đi bộ đêm', image: IMAGES.riverNight },
    ],
    info: {
      openHours: 'Cả ngày',
      price: 'Đền Ngọc Sơn 50.000đ',
      duration: '2 - 3 giờ',
      bestTime: 'Tối thứ 6 - Chủ nhật',
    },
  },
  {
    id: 'pho-co-ha-noi',
    destinationId: 'ha-noi',
    name: 'Phố cổ 36 phố phường',
    location: 'Hoàn Kiếm, Hà Nội',
    category: 'food',
    tags: ['food', 'culture', 'shopping'],
    baseMatch: 84,
    image: IMAGES.market,
    description:
      'Mê cung những con phố nghề trăm năm tuổi, nơi bạn thưởng thức phở, bún chả, cà phê trứng và ngắm nhịp sống Hà Nội xưa qua từng mái ngói.',
    highlights: [
      { name: 'Phố Hàng Mã', image: IMAGES.lanterns },
      { name: 'Ẩm thực đường phố', image: IMAGES.streetFood },
      { name: 'Chợ Đồng Xuân', image: IMAGES.market },
    ],
    info: {
      openHours: 'Cả ngày',
      price: 'Miễn phí',
      duration: '3 - 4 giờ',
      bestTime: 'Sáng sớm hoặc tối',
    },
  },
  {
    id: 'van-mieu',
    destinationId: 'ha-noi',
    name: 'Văn Miếu - Quốc Tử Giám',
    location: 'Đống Đa, Hà Nội',
    category: 'culture',
    tags: ['culture'],
    baseMatch: 78,
    image: IMAGES.frenchVillage,
    description:
      'Trường đại học đầu tiên của Việt Nam, xây dựng năm 1070. Không gian cổ kính với 82 tấm bia tiến sĩ, khuê Văn Các và những hàng cây cổ thụ.',
    highlights: [
      { name: 'Khuê Văn Các', image: IMAGES.frenchVillage },
      { name: 'Bia tiến sĩ', image: IMAGES.hoiAn },
      { name: 'Vườn cổ thụ', image: IMAGES.flowers },
    ],
    info: {
      openHours: '08:00 - 17:00',
      price: '70.000đ',
      duration: '1 - 2 giờ',
      bestTime: 'Sáng sớm',
    },
  },
  {
    id: 'ho-tay',
    destinationId: 'ha-noi',
    name: 'Hồ Tây & Chùa Trấn Quốc',
    location: 'Tây Hồ, Hà Nội',
    category: 'nature',
    tags: ['nature', 'relax', 'culture'],
    baseMatch: 76,
    image: IMAGES.riverNight,
    description:
      'Hồ nước lớn nhất nội thành, nơi có ngôi chùa cổ nhất Hà Nội. Đạp xe vòng hồ, ăn bánh tôm và ngắm hoàng hôn từ các quán cà phê ven hồ.',
    highlights: [
      { name: 'Chùa Trấn Quốc', image: IMAGES.lanterns },
      { name: 'Hoàng hôn Hồ Tây', image: IMAGES.riverNight },
      { name: 'Đạp xe ven hồ', image: IMAGES.walkingStreet },
    ],
    info: {
      openHours: 'Cả ngày',
      price: 'Miễn phí',
      duration: '2 giờ',
      bestTime: 'Chiều tối 16:30 - 18:30',
    },
  },

  // ==================== VỊNH HẠ LONG ====================
  {
    id: 'vinh-ha-long',
    destinationId: 'ha-long',
    name: 'Du thuyền Vịnh Hạ Long',
    location: 'Quảng Ninh, Việt Nam',
    category: 'nature',
    tags: ['nature', 'beach', 'relax', 'adventure'],
    baseMatch: 88,
    image: IMAGES.haLong,
    description:
      'Vịnh Hạ Long nổi tiếng với hàng nghìn hòn đảo đá vôi hùng vĩ, là điểm đến lý tưởng cho những ai yêu thích thiên nhiên, khám phá và chụp ảnh. Bạn có thể tham gia du thuyền, kayak, tham quan hang động và thưởng thức hải sản tươi ngon.',
    highlights: [
      { name: 'Du thuyền ngắm vịnh', image: IMAGES.haLong },
      { name: 'Hang Sửng Sốt', image: IMAGES.cave },
      { name: 'Kayak trên vịnh', image: IMAGES.fishingVillage },
    ],
    info: {
      openHours: '07:00 - 18:00',
      price: '290.000đ - 340.000đ',
      duration: '4 - 6 giờ hoặc 2N1Đ',
      bestTime: 'Tháng 4 - 10',
    },
  },
  {
    id: 'hang-sung-sot',
    destinationId: 'ha-long',
    name: 'Hang Sửng Sốt',
    location: 'Đảo Bồ Hòn, Hạ Long',
    category: 'nature',
    tags: ['nature', 'adventure'],
    baseMatch: 82,
    image: IMAGES.cave,
    description:
      'Hang động rộng và đẹp nhất vịnh với hệ thống thạch nhũ muôn hình vạn trạng, chia làm hai buồng lớn được chiếu sáng lung linh.',
    highlights: [
      { name: 'Buồng thạch nhũ', image: IMAGES.cave },
      { name: 'Lối lên hang', image: IMAGES.island },
      { name: 'View vịnh từ cửa hang', image: IMAGES.haLong },
    ],
    info: {
      openHours: '07:30 - 17:00',
      price: 'Đã gồm trong vé vịnh',
      duration: '1 giờ',
      bestTime: 'Buổi sáng',
    },
  },
  {
    id: 'dao-ti-top',
    destinationId: 'ha-long',
    name: 'Đảo Ti Tốp',
    location: 'Vịnh Hạ Long, Quảng Ninh',
    category: 'beach',
    tags: ['beach', 'adventure', 'relax'],
    baseMatch: 80,
    image: IMAGES.island,
    description:
      'Hòn đảo có bãi tắm hình vầng trăng khuyết và đỉnh vọng cảnh với tầm nhìn 360° ra toàn vịnh sau hơn 400 bậc đá.',
    highlights: [
      { name: 'Đỉnh vọng cảnh', image: IMAGES.island },
      { name: 'Bãi tắm Ti Tốp', image: IMAGES.fishingVillage },
      { name: 'Hoàng hôn trên vịnh', image: IMAGES.haLong },
    ],
    info: {
      openHours: '07:00 - 18:00',
      price: 'Đã gồm trong vé vịnh',
      duration: '1.5 giờ',
      bestTime: 'Chiều muộn',
    },
  },
  {
    id: 'cua-van',
    destinationId: 'ha-long',
    name: 'Làng chài Cửa Vạn',
    location: 'Vịnh Hạ Long, Quảng Ninh',
    category: 'culture',
    tags: ['culture', 'food', 'relax'],
    baseMatch: 76,
    image: IMAGES.fishingVillage,
    description:
      'Làng chài nổi giữa vịnh, nơi bạn ngồi đò nan tìm hiểu đời sống ngư dân và thưởng thức hải sản vừa đánh bắt.',
    highlights: [
      { name: 'Chèo đò nan', image: IMAGES.fishingVillage },
      { name: 'Nhà bè nổi', image: IMAGES.haLong },
      { name: 'Hải sản tươi', image: IMAGES.streetFood },
    ],
    info: {
      openHours: '07:00 - 17:00',
      price: 'Đò nan 150.000đ/người',
      duration: '1 - 2 giờ',
      bestTime: 'Buổi sáng',
    },
  },

  // ==================== SA PA ====================
  {
    id: 'muong-hoa',
    destinationId: 'sa-pa',
    name: 'Thung lũng Mường Hoa',
    location: 'Sa Pa, Lào Cai',
    category: 'nature',
    tags: ['nature', 'adventure'],
    baseMatch: 88,
    image: IMAGES.sapa,
    description:
      'Thung lũng ruộng bậc thang đẹp nhất Sa Pa, đặc biệt vào mùa lúa chín tháng 9. Trekking qua các bản Lao Chải, Tả Van và khám phá bãi đá cổ.',
    highlights: [
      { name: 'Ruộng bậc thang', image: IMAGES.sapa },
      { name: 'Bản Tả Van', image: IMAGES.village },
      { name: 'Bãi đá cổ', image: IMAGES.haLong },
    ],
    info: {
      openHours: 'Cả ngày',
      price: '75.000đ/vé vào bản',
      duration: 'Nửa ngày',
      bestTime: 'Tháng 9 - 10 (lúa chín)',
    },
  },
  {
    id: 'fansipan',
    destinationId: 'sa-pa',
    name: 'Đỉnh Fansipan',
    location: 'Sa Pa, Lào Cai',
    category: 'nature',
    tags: ['nature', 'adventure'],
    baseMatch: 84,
    image: IMAGES.village,
    description:
      'Nóc nhà Đông Dương cao 3.143m. Bạn có thể đi cáp treo xuyên mây hoặc chinh phục bằng trekking 2 ngày cho trải nghiệm trọn vẹn.',
    highlights: [
      { name: 'Cáp treo Fansipan', image: IMAGES.village },
      { name: 'Biển mây', image: IMAGES.sapa },
      { name: 'Quần thể tâm linh', image: IMAGES.lanterns },
    ],
    info: {
      openHours: '07:30 - 17:30',
      price: '800.000đ (cáp treo)',
      duration: 'Nửa ngày',
      bestTime: 'Sáng sớm, tháng 10 - 12',
    },
  },
  {
    id: 'cat-cat',
    destinationId: 'sa-pa',
    name: 'Bản Cát Cát',
    location: 'San Sả Hồ, Sa Pa',
    category: 'culture',
    tags: ['culture', 'shopping', 'nature'],
    baseMatch: 80,
    image: IMAGES.flowers,
    description:
      'Bản làng của người H’Mông với thác nước, nhà gỗ truyền thống, nghề dệt thổ cẩm và các tiết mục văn nghệ dân tộc.',
    highlights: [
      { name: 'Thác Cát Cát', image: IMAGES.village },
      { name: 'Dệt thổ cẩm', image: IMAGES.market },
      { name: 'Vườn hoa', image: IMAGES.flowers },
    ],
    info: {
      openHours: '06:00 - 18:00',
      price: '150.000đ',
      duration: '2 - 3 giờ',
      bestTime: 'Buổi sáng',
    },
  },
  {
    id: 'cho-sapa',
    destinationId: 'sa-pa',
    name: 'Chợ đêm & ẩm thực Sa Pa',
    location: 'Thị xã Sa Pa',
    category: 'food',
    tags: ['food', 'shopping'],
    baseMatch: 74,
    image: IMAGES.streetFood,
    description:
      'Thưởng thức lẩu cá hồi, thắng cố, xiên nướng và rượu táo mèo giữa tiết trời se lạnh, mua sắm đồ thổ cẩm làm quà.',
    highlights: [
      { name: 'Đồ nướng vùng cao', image: IMAGES.streetFood },
      { name: 'Chợ thổ cẩm', image: IMAGES.market },
      { name: 'Nhà thờ đá', image: IMAGES.frenchVillage },
    ],
    info: {
      openHours: '17:00 - 22:00',
      price: '100.000đ - 300.000đ/người',
      duration: '1 - 2 giờ',
      bestTime: 'Tối thứ 7',
    },
  },

  // ==================== PHÚ QUỐC ====================
  {
    id: 'bai-sao',
    destinationId: 'phu-quoc',
    name: 'Bãi Sao',
    location: 'An Thới, Phú Quốc',
    category: 'beach',
    tags: ['beach', 'relax'],
    baseMatch: 88,
    image: IMAGES.fishingVillage,
    description:
      'Bãi biển cát trắng mịn như kem với làn nước xanh ngọc trong vắt, một trong những bãi biển đẹp nhất Việt Nam.',
    highlights: [
      { name: 'Bãi cát trắng', image: IMAGES.fishingVillage },
      { name: 'Hàng dừa', image: IMAGES.island },
      { name: 'Hải sản ven biển', image: IMAGES.streetFood },
    ],
    info: {
      openHours: 'Cả ngày',
      price: 'Miễn phí',
      duration: 'Nửa ngày',
      bestTime: 'Tháng 11 - 4',
    },
  },
  {
    id: 'hon-thom',
    destinationId: 'phu-quoc',
    name: 'Cáp treo Hòn Thơm',
    location: 'An Thới, Phú Quốc',
    category: 'entertainment',
    tags: ['adventure', 'beach', 'nature'],
    baseMatch: 84,
    image: IMAGES.island,
    description:
      'Tuyến cáp treo vượt biển dài nhất thế giới (7.9km) đưa bạn ngắm quần đảo An Thới từ trên cao và vui chơi tại công viên nước Aquatopia.',
    highlights: [
      { name: 'Cáp treo vượt biển', image: IMAGES.island },
      { name: 'Quần đảo An Thới', image: IMAGES.haLong },
      { name: 'Công viên nước', image: IMAGES.fishingVillage },
    ],
    info: {
      openHours: '09:00 - 17:00',
      price: '600.000đ',
      duration: 'Cả ngày',
      bestTime: 'Buổi sáng',
    },
  },
  {
    id: 'dinh-cau',
    destinationId: 'phu-quoc',
    name: 'Chợ đêm Dinh Cậu',
    location: 'Dương Đông, Phú Quốc',
    category: 'food',
    tags: ['food', 'shopping'],
    baseMatch: 80,
    image: IMAGES.market,
    description:
      'Chợ đêm sầm uất với hải sản tươi sống, gỏi cá trích, kem cuộn và các món quà ngọc trai, nước mắm Phú Quốc.',
    highlights: [
      { name: 'Hải sản nướng', image: IMAGES.streetFood },
      { name: 'Ngọc trai', image: IMAGES.market },
      { name: 'Dinh Cậu', image: IMAGES.lanterns },
    ],
    info: {
      openHours: '17:00 - 23:00',
      price: '100.000đ - 400.000đ/người',
      duration: '1 - 2 giờ',
      bestTime: 'Tối',
    },
  },
  {
    id: 'sunset-town',
    destinationId: 'phu-quoc',
    name: 'Thị trấn Hoàng Hôn',
    location: 'An Thới, Phú Quốc',
    category: 'entertainment',
    tags: ['relax', 'culture', 'shopping'],
    baseMatch: 78,
    image: IMAGES.frenchVillage,
    description:
      'Thị trấn phong cách Địa Trung Hải với Cầu Hôn, tháp đồng hồ và show Nụ Hôn Của Biển Cả rực rỡ trên mặt nước.',
    highlights: [
      { name: 'Cầu Hôn', image: IMAGES.island },
      { name: 'Phố Địa Trung Hải', image: IMAGES.frenchVillage },
      { name: 'Show pháo hoa', image: IMAGES.riverNight },
    ],
    info: {
      openHours: '09:00 - 22:00',
      price: 'Miễn phí (show 500.000đ)',
      duration: '3 giờ',
      bestTime: 'Hoàng hôn 17:30',
    },
  },
];

/** Độ phù hợp = điểm gốc + 4 điểm mỗi sở thích trùng (tối đa 99) */
export const getMatchScore = (place: SuggestedPlace, interests: string[]) => {
  const overlap = place.tags.filter((tag) => interests.includes(tag)).length;
  return Math.min(99, place.baseMatch + overlap * 4);
};

export const getMatchLabel = (score: number) =>
  score >= 90 ? 'Rất phù hợp' : score >= 80 ? 'Phù hợp' : 'Khá phù hợp';
