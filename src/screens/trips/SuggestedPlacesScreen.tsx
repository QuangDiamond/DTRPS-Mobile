
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Alert,
  BackHandler,
  FlatList,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import MapView, {
  Marker,
  type LatLng,
} from 'react-native-maps';

import { planDestinations } from '../../constants/planTrip';

import {
  getMatchScore,
  suggestedPlaces,
  suggestionCategoryLabels,
  type SuggestedPlace,
  type SuggestionCategory,
} from '../../constants/suggestedPlaces';

import SuggestionDetailScreen from './SuggestionDetailScreen';

// ==================== TYPES ====================

type SuggestedPlacesScreenProps = {
  destinationId: string;
  interests: string[];
  onBack: () => void;
  onSavePlan: (placeIds: string[]) => void;
  // Tùy chọn: kết nối sang trang chi tiết quảng cáo Partner về sau.
  onPartnerAdPress?: (ad: PartnerAd) => void;
};

type MapPlace = SuggestedPlace & {
  match: number;
  rating: number;
  mapCoordinate: LatLng;
  approximate: boolean;
};

type CompareRow = {
  id: string;
  place: MapPlace | null;
  ad: PartnerAd | null;
  aiIndex: number;
};

type PlaceWithCoordinate = SuggestedPlace & {
  coordinate?: LatLng;
  latitude?: number;
  longitude?: number;
  rating?: number;
};


// Quảng cáo Partner hardcode, độc lập với địa điểm AI và marker trên bản đồ.
// Tất cả tên đối tác, ưu đãi, giá và đánh giá là dữ liệu minh họa.
export type PartnerAd = {
  id: string;
  destinationKey: string;
  name: string;
  category: 'Lưu trú' | 'Ẩm thực' | 'Trải nghiệm';
  location: string;
  image: string;
  offer: string;
  price: string;
  description: string;
};

const PARTNER_ADS: PartnerAd[] = [
  {
    id: 'p-hn-1', destinationKey: 'ha noi', name: 'Mộc Phố Coffee',
    category: 'Ẩm thực', location: 'Hà Nội', offer: 'Mua 1 tặng 1',
    price: '49.000đ', description: 'Một không gian cà phê ấm cúng ngay giữa phố.',
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=85',
  },
  {
    id: 'p-hn-2', destinationKey: 'ha noi', name: 'Hồ Gươm Boutique',
    category: 'Lưu trú', location: 'Hoàn Kiếm, Hà Nội', offer: 'Giảm 20%',
    price: '790.000đ', description: 'Không gian lưu trú tinh tế gần khu phố cổ.',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=85',
  },
  {
    id: 'p-dn-1', destinationKey: 'da nang', name: 'Sóng Xanh Resort',
    category: 'Lưu trú', location: 'Đà Nẵng', offer: 'Giảm 30%',
    price: '1.250.000đ', description: 'Kỳ nghỉ bên bờ biển với hồ bơi xanh mát.',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=85',
  },
  {
    id: 'p-dn-2', destinationKey: 'da nang', name: 'Bếp Biển Đà Nẵng',
    category: 'Ẩm thực', location: 'Sơn Trà, Đà Nẵng', offer: 'Tặng món',
    price: '199.000đ', description: 'Khám phá hương vị biển và đặc sản địa phương.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=85',
  },
  {
    id: 'p-ha-1', destinationKey: 'hoi an', name: 'Bếp Nhà Hội An',
    category: 'Ẩm thực', location: 'Hội An, Quảng Nam', offer: 'Giảm 20%',
    price: '199.000đ', description: 'Món ngon truyền thống trong không gian phố Hội.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=85',
  },
  {
    id: 'p-ha-2', destinationKey: 'hoi an', name: 'Lantern Riverside',
    category: 'Lưu trú', location: 'Hội An, Quảng Nam', offer: 'Giảm 15%',
    price: '690.000đ', description: 'Nghỉ dưỡng bên sông với phong cách phố cổ.',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=85',
  },
  {
    id: 'p-dl-1', destinationKey: 'da lat', name: 'Mây Retreat',
    category: 'Lưu trú', location: 'Đà Lạt', offer: 'Giảm 25%',
    price: '890.000đ', description: 'Một kỳ nghỉ giữa thiên nhiên và rừng thông.',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=85',
  },
  {
    id: 'p-dl-2', destinationKey: 'da lat', name: 'Chill Đà Lạt Cafe',
    category: 'Ẩm thực', location: 'Đà Lạt', offer: 'Tặng đồ uống',
    price: '59.000đ', description: 'Góc cà phê yên tĩnh với không khí cao nguyên.',
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=85',
  },
  {
    id: 'p-hl-1', destinationKey: 'ha long', name: 'Blue Bay Cruise',
    category: 'Trải nghiệm', location: 'Hạ Long, Quảng Ninh', offer: 'Giảm 15%',
    price: '950.000đ', description: 'Trải nghiệm vịnh biển trên du thuyền.',
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800&q=85',
  },
  {
    id: 'p-sp-1', destinationKey: 'sa pa', name: 'Sapa Cloud Stay',
    category: 'Lưu trú', location: 'Sa Pa, Lào Cai', offer: 'Giảm 20%',
    price: '590.000đ', description: 'Không gian nghỉ dưỡng hướng núi.',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=85',
  },
  {
    id: 'p-hue-1', destinationKey: 'hue', name: 'Cố Đô Garden House',
    category: 'Ẩm thực', location: 'Huế', offer: 'Giảm 10%',
    price: '149.000đ', description: 'Khám phá hương vị ẩm thực xứ Huế.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=85',
  },
  {
    id: 'p-nt-1', destinationKey: 'nha trang', name: 'Ocean Breeze Resort',
    category: 'Lưu trú', location: 'Nha Trang', offer: 'Giảm 25%',
    price: '990.000đ', description: 'Phòng nghỉ gần biển cùng nhiều tiện ích.',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=85',
  },
  {
    id: 'p-pq-1', destinationKey: 'phu quoc', name: 'Hải Âu Experience',
    category: 'Trải nghiệm', location: 'Phú Quốc', offer: 'Giảm 15%',
    price: '590.000đ', description: 'Một ngày khám phá biển đảo thú vị.',
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800&q=85',
  },
  {
    id: 'p-hcm-1', destinationKey: 'ho chi minh', name: 'Saigon Rooftop Dining',
    category: 'Ẩm thực', location: 'TP. Hồ Chí Minh', offer: 'Giảm 15%',
    price: '259.000đ', description: 'Ẩm thực thành phố trong không gian hiện đại.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=85',
  },
];

// Dữ liệu Partner DEMO: mỗi điểm đến có một danh sách độc lập.
// Không lặp cùng một thẻ trong một lượt cuộn, không trộn với điểm AI.
function getPartnerAds(destinationName: string): PartnerAd[] {
  const key = normalizeName(destinationName);
  const localAds = PARTNER_ADS.filter(ad => key.includes(ad.destinationKey));

  // Các mẫu quảng cáo bổ sung để thử nghiệm giao diện trên nhiều điểm đến.
  // Đây không phải doanh nghiệp/ưu đãi thực tế.
  const demoOffers: Omit<PartnerAd, 'id' | 'destinationKey' | 'location'>[] = [
    {
      name: 'Nắng Boutique Stay', category: 'Lưu trú', offer: 'Ưu đãi 15%',
      price: '780.000đ', description: 'Không gian nghỉ ngơi thanh lịch gần các điểm tham quan.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=82',
    },
    {
      name: 'Bếp Bản Địa', category: 'Ẩm thực', offer: 'Tặng món ngon',
      price: '179.000đ', description: 'Trải nghiệm hương vị địa phương trong không gian ấm cúng.',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=82',
    },
    {
      name: 'Chạm Travel', category: 'Trải nghiệm', offer: 'Giảm 12%',
      price: '320.000đ', description: 'Khám phá địa phương với các hoạt động thú vị.',
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&q=82',
    },
    {
      name: 'Mơ Home & Garden', category: 'Lưu trú', offer: 'Giảm 20%',
      price: '650.000đ', description: 'Góc lưu trú xanh mát, phù hợp chuyến đi thư giãn.',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900&q=82',
    },
    {
      name: 'Phố Nhỏ Coffee', category: 'Ẩm thực', offer: 'Mua 1 tặng 1',
      price: '55.000đ', description: 'Góc cà phê thư giãn và những cuộc hẹn dễ thương.',
      image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=900&q=82',
    },
    {
      name: 'Một Ngày Khám Phá', category: 'Trải nghiệm', offer: 'Tiết kiệm 10%',
      price: '290.000đ', description: 'Chuyến trải nghiệm dành cho người yêu khám phá.',
      image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=900&q=82',
    },
    {
      name: 'Sông & Biển Retreat', category: 'Lưu trú', offer: 'Giảm 18%',
      price: '920.000đ', description: 'Kỳ nghỉ với phong cách nhẹ nhàng và gần thiên nhiên.',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=82',
    },
    {
      name: 'Bếp Xanh Kitchen', category: 'Ẩm thực', offer: 'Ưu đãi combo',
      price: '210.000đ', description: 'Bữa ăn thân mật với những hương vị quen thuộc.',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=82',
    },
  ];

  const supplemental: PartnerAd[] = demoOffers.map((ad, index) => ({
    ...ad,
    id: `demo-${key}-${index}`,
    destinationKey: key,
    location: destinationName,
  }));

  return [...localAds, ...supplemental].slice(0, 12);
}

// ==================== COLORS ====================

const COLORS = {
  primary: '#087A78',
  primaryDark: '#075C66',
  text: '#13364A',
  muted: '#72818C',
  background: '#F8F8FF',
  lightPurple: '#EBEDFF',
  mint: '#C3F8F0',
  heart: '#E5484D',
  white: '#FFFFFF',
  star: '#F59E38',
  border: '#EBEDF5',
};

const FLOW_STEPS = 6;
const CURRENT_FLOW_STEP = 3;

// ==================== HELPERS ====================

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .trim();
}

// ==================== DESTINATION CENTER ====================

function getDestinationCenter(name: string): LatLng {
  const key = normalizeName(name);

  if (key.includes('ha noi')) {
    return {
      latitude: 21.0285,
      longitude: 105.8542,
    };
  }

  if (key.includes('da nang')) {
    return {
      latitude: 16.0678,
      longitude: 108.2208,
    };
  }

  if (key.includes('hoi an')) {
    return {
      latitude: 15.8801,
      longitude: 108.3380,
    };
  }

  if (key.includes('ha long')) {
    return {
      latitude: 20.9517,
      longitude: 107.0789,
    };
  }

  if (key.includes('sa pa')) {
    return {
      latitude: 22.3364,
      longitude: 103.8438,
    };
  }

  if (key.includes('hue')) {
    return {
      latitude: 16.4637,
      longitude: 107.5909,
    };
  }

  if (key.includes('da lat')) {
    return {
      latitude: 11.9404,
      longitude: 108.4583,
    };
  }

  if (key.includes('nha trang')) {
    return {
      latitude: 12.2388,
      longitude: 109.1967,
    };
  }

  if (key.includes('phu quoc')) {
    return {
      latitude: 10.2899,
      longitude: 103.9840,
    };
  }

  if (
    key.includes('ho chi minh') ||
    key.includes('sai gon')
  ) {
    return {
      latitude: 10.7769,
      longitude: 106.7009,
    };
  }

  return {
    latitude: 16.0678,
    longitude: 108.2208,
  };
}

// ==================== MAP COORDINATES ====================

// Tọa độ mẫu để hiển thị marker.
// Nếu dữ liệu SuggestedPlace có coordinate thật,
// hệ thống sẽ ưu tiên tọa độ đó.

const KNOWN_COORDINATES: {
  name: string;
  coordinate: LatLng;
}[] = [
  {
    name: 'ho hoan kiem',
    coordinate: {
      latitude: 21.0285,
      longitude: 105.8522,
    },
  },
  {
    name: 'van mieu',
    coordinate: {
      latitude: 21.0293,
      longitude: 105.8357,
    },
  },
  {
    name: 'pho co ha noi',
    coordinate: {
      latitude: 21.0340,
      longitude: 105.8500,
    },
  },
  {
    name: 'lang chu tich ho chi minh',
    coordinate: {
      latitude: 21.0368,
      longitude: 105.8347,
    },
  },
  {
    name: 'lang bac',
    coordinate: {
      latitude: 21.0368,
      longitude: 105.8347,
    },
  },
  {
    name: 'nha tho lon ha noi',
    coordinate: {
      latitude: 21.02866,
      longitude: 105.84885,
    },
  },
  {
    name: 'nha tu hoa lo',
    coordinate: {
      latitude: 21.02538,
      longitude: 105.84643,
    },
  },
  {
    name: 'ban dao son tra',
    coordinate: {
      latitude: 16.1170,
      longitude: 108.2730,
    },
  },
  {
    name: 'chua linh ung',
    coordinate: {
      latitude: 16.1014,
      longitude: 108.2782,
    },
  },
  {
    name: 'dinh ban co',
    coordinate: {
      latitude: 16.1193,
      longitude: 108.2720,
    },
  },
  {
    name: 'bien my khe',
    coordinate: {
      latitude: 16.0567,
      longitude: 108.2497,
    },
  },
  {
    name: 'ngu hanh son',
    coordinate: {
      latitude: 16.0034,
      longitude: 108.2635,
    },
  },
  {
    name: 'ba na hills',
    coordinate: {
      latitude: 15.9950,
      longitude: 107.9920,
    },
  },
  {
    name: 'pho co hoi an',
    coordinate: {
      latitude: 15.8801,
      longitude: 108.3380,
    },
  },
];

// ==================== DEMO RATINGS ====================

// Rating hardcode phục vụ demo giao diện.
// Khi có API đánh giá thật thì thay bảng này.

const DEMO_RATINGS: {
  name: string;
  rating: number;
}[] = [
  { name: 'ho hoan kiem', rating: 4.7 },
  { name: 'van mieu', rating: 4.6 },
  { name: 'pho co ha noi', rating: 4.5 },
  { name: 'lang bac', rating: 4.6 },
  { name: 'lang chu tich ho chi minh', rating: 4.6 },
  { name: 'nha tho lon ha noi', rating: 4.7 },
  { name: 'nha tu hoa lo', rating: 4.5 },
  { name: 'ban dao son tra', rating: 4.8 },
  { name: 'chua linh ung', rating: 4.7 },
  { name: 'dinh ban co', rating: 4.6 },
  { name: 'bien my khe', rating: 4.8 },
  { name: 'ngu hanh son', rating: 4.5 },
  { name: 'ba na hills', rating: 4.6 },
  { name: 'pho co hoi an', rating: 4.8 },
];

function getDemoRating(place: SuggestedPlace): number {
  const source = place as PlaceWithCoordinate;

  // Nếu dữ liệu đã có rating hợp lệ, ưu tiên sử dụng.
  if (
    typeof source.rating === 'number' &&
    Number.isFinite(source.rating) &&
    source.rating >= 0 &&
    source.rating <= 5
  ) {
    return source.rating;
  }

  const key = normalizeName(place.name);

  const match = DEMO_RATINGS.find(item =>
    key.includes(item.name)
  );

  return match?.rating ?? 4.5;
}

// ==================== RESOLVE COORDINATE ====================

function resolveCoordinate(
  place: SuggestedPlace,
  index: number,
  center: LatLng
): {
  coordinate: LatLng;
  approximate: boolean;
} {
  const source = place as PlaceWithCoordinate;

  const explicit =
    source.coordinate ??
    (
      typeof source.latitude === 'number' &&
      typeof source.longitude === 'number'
        ? {
          latitude: source.latitude,
          longitude: source.longitude,
        }
        : undefined
    );

  if (
    explicit &&
    Number.isFinite(explicit.latitude) &&
    Number.isFinite(explicit.longitude)
  ) {
    return {
      coordinate: explicit,
      approximate: false,
    };
  }

  const key = normalizeName(place.name);

  const known = KNOWN_COORDINATES.find(item =>
    key.includes(item.name)
  );

  if (known) {
    return {
      coordinate: known.coordinate,
      approximate: true,
    };
  }

  // Chỉ là vị trí minh họa nếu chưa có tọa độ.
  const angle = index * 2.39996;
  const radius = 0.007 + (index % 5) * 0.003;

  return {
    coordinate: {
      latitude:
        center.latitude + Math.cos(angle) * radius,
      longitude:
        center.longitude + Math.sin(angle) * radius,
    },
    approximate: true,
  };
}

// ==================== 2 NEW HANOI PLACES ====================

// Bổ sung 2 địa điểm mẫu cho Hà Nội.
// Tọa độ dựa trên vị trí tham khảo; rating là mock.
// Ảnh từ Wikimedia Commons.

const EXTRA_HANOI_PLACES = [
  {
    id: 'demo-nha-tho-lon-ha-noi',
    name: 'Nhà thờ Lớn Hà Nội',
    location: 'Nhà Chung, Hoàn Kiếm, Hà Nội',
    description:
      'Công trình kiến trúc Gothic nổi bật giữa trung tâm Hà Nội. Du khách có thể tham quan, chụp ảnh và khám phá không gian phố cổ xung quanh.',
    image:
      'https://commons.wikimedia.org/wiki/Special:FilePath/St%20Joseph%20Cathedral%20Hanoi%202025-10-26.jpg?width=800',
    tags: ['culture'] as SuggestedPlace['tags'],
    categoryHint: 'culture',
    coordinate: {
      latitude: 21.02866,
      longitude: 105.84885,
    },
    rating: 4.7,
  },
  {
    id: 'demo-nha-tu-hoa-lo',
    name: 'Nhà tù Hỏa Lò',
    location: 'Phố Hỏa Lò, Hoàn Kiếm, Hà Nội',
    description:
      'Di tích lịch sử nổi tiếng, nơi tìm hiểu về lịch sử Việt Nam qua các khu trưng bày, hiện vật và câu chuyện được lưu giữ.',
    image:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Maison-centrale.jpeg?width=800',
    tags: ['culture'] as SuggestedPlace['tags'],
    categoryHint: 'culture',
    coordinate: {
      latitude: 21.02538,
      longitude: 105.84643,
    },
    rating: 4.5,
  },
];

// Chuyển dữ liệu demo thành SuggestedPlace,
// tận dụng cấu trúc đang có để màn Detail vẫn chạy.

function createExtraHanoiPlaces(
  existing: SuggestedPlace[],
  destinationId: string
): SuggestedPlace[] {
  if (existing.length === 0) {
    return [];
  }

  const cultureTemplate =
    existing.find(place =>
      place.tags.includes('culture')
    ) ?? existing[0];

  return EXTRA_HANOI_PLACES
    .filter(extra =>
      !existing.some(
        place =>
          normalizeName(place.name) ===
          normalizeName(extra.name)
      )
    )
    .map(extra => {
      const template = cultureTemplate;

      return {
        ...template,
        id: extra.id,
        destinationId,
        name: extra.name,
        location: extra.location,
        description: extra.description,
        image: extra.image,
        tags: extra.tags,

        // Danh mục kế thừa từ một địa điểm văn hóa
        // hiện có, giữ đúng kiểu dữ liệu của dự án.
        category: template.category,

        highlights: template.highlights.map(
          (highlight, index) => ({
            ...highlight,
            name:
              index === 0
                ? extra.name
                : index === 1
                  ? 'Kiến trúc và không gian'
                  : 'Góc tham quan nổi bật',
            image: extra.image,
          })
        ),

        info: {
          ...template.info,
          openHours: 'Kiểm tra trước khi tham quan',
          price: 'Tham khảo tại điểm đến',
          duration: '60–90 phút',
          bestTime: 'Buổi sáng hoặc chiều',
        },

        coordinate: extra.coordinate,
        rating: extra.rating,
      };
    });
}

// ==================== TWO MATCHED CARD STYLES ====================
// Cùng kích thước, cùng bố cục ảnh -> tiêu đề -> thông tin -> CTA.
// AI = kết quả theo sở thích; Partner = quảng cáo, luôn ghi rõ nhãn tài trợ.

const CARD_HEIGHT = 286;
const CARD_IMAGE_HEIGHT = 122;
const CARD_RADIUS = 18;

function MatchCard({
                     place, index, favorite, inPlan, active,
                     onPress, onToggleFavorite, onTogglePlan,
                   }: {
  place: MapPlace;
  index: number;
  favorite: boolean;
  inPlan: boolean;
  active: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  onTogglePlan: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Xem địa điểm ${place.name}`}
      style={{
        flex: 1, minWidth: 0, height: CARD_HEIGHT,
        borderRadius: CARD_RADIUS, backgroundColor: COLORS.white,
        borderWidth: active ? 1.5 : 1,
        borderColor: active ? COLORS.primary : '#E7EBEF',
        overflow: 'hidden',
        shadowColor: '#0D4543', shadowOpacity: 0.07,
        shadowRadius: 9, shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <ImageBackground
        source={{ uri: place.image }}
        resizeMode="cover"
        style={{ height: CARD_IMAGE_HEIGHT, justifyContent: 'space-between' }}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.36)', 'rgba(0,0,0,0.02)', 'rgba(0,0,0,0.37)']}
          locations={[0, 0.52, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View className="flex-row items-start justify-between px-2 pt-2">
          <View className="flex-row items-center rounded-full bg-white/95 px-2 py-1.5">
            <MaterialCommunityIcons name="creation" size={11} color={COLORS.primaryDark} />
            <Text className="ml-1 text-[9px] font-extrabold" style={{ color: COLORS.primaryDark }}>
              AI GỢI Ý
            </Text>
          </View>
          <Pressable
            hitSlop={8}
            onPress={event => { event.stopPropagation(); onToggleFavorite(); }}
            accessibilityRole="button"
            accessibilityLabel={favorite ? 'Bỏ yêu thích' : 'Lưu yêu thích'}
            className="h-8 w-8 items-center justify-center rounded-full bg-white/95"
          >
            <MaterialCommunityIcons
              name={favorite ? 'heart' : 'heart-outline'}
              size={18}
              color={favorite ? COLORS.heart : COLORS.primaryDark}
            />
          </Pressable>
        </View>
        <View className="mb-2 ml-2 self-start rounded-full bg-[#DAFAF0] px-2.5 py-1.5">
          <Text className="text-[10px] font-extrabold" style={{ color: COLORS.primaryDark }}>
            <MaterialCommunityIcons name="star-four-points" size={11} color={COLORS.primaryDark} />{' '}
            {place.match}% phù hợp
          </Text>
        </View>
      </ImageBackground>

      <View style={{ flex: 1, paddingHorizontal: 11, paddingTop: 9, paddingBottom: 10 }}>
        <Text numberOfLines={2} style={{ height: 37, color: COLORS.text, fontWeight: '800', fontSize: 13.5, lineHeight: 18 }}>
          {place.name}
        </Text>
        <View className="mt-0.5 flex-row items-center">
          <MaterialCommunityIcons name="map-marker-outline" size={12} color={COLORS.muted} />
          <Text numberOfLines={1} className="ml-0.5 flex-1 text-[10px]" style={{ color: COLORS.muted }}>
            {place.location}
          </Text>
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="star" size={13} color="#E6A332" />
            <Text className="ml-1 text-[11px] font-bold" style={{ color: COLORS.text }}>
              {place.rating.toFixed(1)}
            </Text>
          </View>
          <Text className="text-[10px] font-semibold" style={{ color: COLORS.muted }}>
            #{index + 1} theo sở thích
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={event => { event.stopPropagation(); onTogglePlan(); }}
          accessibilityRole="button"
          accessibilityLabel={inPlan ? 'Bỏ khỏi kế hoạch' : 'Thêm vào kế hoạch'}
          className="h-9 flex-row items-center justify-center rounded-xl"
          style={{ backgroundColor: inPlan ? '#DAF5EA' : COLORS.primaryDark }}
        >
          <MaterialCommunityIcons
            name={inPlan ? 'check-circle-outline' : 'plus'}
            size={16}
            color={inPlan ? COLORS.primaryDark : 'white'}
          />
          <Text
            numberOfLines={1}
            className="ml-1 text-[10px] font-extrabold"
            style={{ color: inPlan ? COLORS.primaryDark : 'white' }}
          >
            {inPlan ? 'Đã thêm' : 'Thêm vào kế hoạch'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function SponsoredCard({ ad, onPress }: { ad: PartnerAd; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Xem thông tin quảng cáo từ ${ad.name}`}
      style={{
        flex: 1, minWidth: 0, height: CARD_HEIGHT,
        borderRadius: CARD_RADIUS, backgroundColor: COLORS.white,
        borderWidth: 1, borderColor: '#E7EBEF', overflow: 'hidden',
        shadowColor: '#0D4543', shadowOpacity: 0.07,
        shadowRadius: 9, shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <ImageBackground
        source={{ uri: ad.image }}
        resizeMode="cover"
        style={{ height: CARD_IMAGE_HEIGHT, justifyContent: 'space-between' }}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.36)', 'rgba(0,0,0,0.02)', 'rgba(0,0,0,0.37)']}
          locations={[0, 0.52, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View className="flex-row items-start justify-between px-2 pt-2">
          <View className="flex-row items-center rounded-full bg-white/95 px-2 py-1.5">
            <MaterialCommunityIcons name="storefront-outline" size={11} color={COLORS.primaryDark} />
            <Text className="ml-1 text-[9px] font-extrabold" style={{ color: COLORS.primaryDark }}>
              TÀI TRỢ
            </Text>
          </View>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-white/95">
            <MaterialCommunityIcons name="tag-outline" size={18} color={COLORS.primaryDark} />
          </View>
        </View>
        <View className="mb-2 ml-2 self-start rounded-full bg-[#FFF3D5] px-2.5 py-1.5">
          <Text className="text-[10px] font-extrabold text-[#79551B]" numberOfLines={1}>
            {ad.offer}
          </Text>
        </View>
      </ImageBackground>

      <View style={{ flex: 1, paddingHorizontal: 11, paddingTop: 9, paddingBottom: 10 }}>
        <Text numberOfLines={2} style={{ height: 37, color: COLORS.text, fontWeight: '800', fontSize: 13.5, lineHeight: 18 }}>
          {ad.name}
        </Text>
        <View className="mt-0.5 flex-row items-center">
          <MaterialCommunityIcons name="map-marker-outline" size={12} color={COLORS.muted} />
          <Text numberOfLines={1} className="ml-0.5 flex-1 text-[10px]" style={{ color: COLORS.muted }}>
            {ad.location}
          </Text>
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <Text numberOfLines={1} className="flex-1 text-[10px] font-semibold" style={{ color: COLORS.muted }}>
            {ad.category}
          </Text>
          <Text numberOfLines={1} className="ml-1 text-[11px] font-extrabold" style={{ color: COLORS.primaryDark }}>
            {ad.price}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <View className="h-9 flex-row items-center justify-center rounded-xl" style={{ backgroundColor: COLORS.primaryDark }}>
          <Text numberOfLines={1} className="mr-1 text-[10px] font-extrabold text-white">
            Xem dịch vụ
          </Text>
          <MaterialCommunityIcons name="arrow-top-right" size={15} color="white" />
        </View>
      </View>
    </Pressable>
  );
}

// Vẽ vị trí trống trung tính thay vì lặp quảng cáo hoặc bịa dữ liệu.
function EmptyColumnCard({ label }: { label: string }) {
  return (
    <View
      style={{
        flex: 1, minWidth: 0, height: CARD_HEIGHT,
        borderRadius: CARD_RADIUS, borderWidth: 1,
        borderColor: '#E9EEF0', borderStyle: 'dashed',
        backgroundColor: '#F8FBFA', justifyContent: 'center',
        alignItems: 'center', paddingHorizontal: 12,
      }}
    >
      <MaterialCommunityIcons name="map-search-outline" size={25} color="#A8B7B6" />
      <Text className="mt-2 text-center text-[11px] leading-[17px]" style={{ color: COLORS.muted }}>
        {label}
      </Text>
    </View>
  );
}

// ==================== MAIN SCREEN ====================

export default function SuggestedPlacesScreen({
                                                destinationId,
                                                interests,
                                                onBack,
                                                onSavePlan,
                                                onPartnerAdPress,
                                              }: SuggestedPlacesScreenProps) {

  // ==================== DESTINATION ====================

  const destination =
    planDestinations.find(
      item => item.id === destinationId
    ) ?? planDestinations[0];

  // ==================== STATES ====================

  const [category, setCategory] =
    useState<SuggestionCategory | 'all'>('all');

  const [favorites, setFavorites] =
    useState<string[]>([]);

  const [planIds, setPlanIds] =
    useState<string[]>([]);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [activeId, setActiveId] =
    useState<string | null>(null);

  const [mapReady, setMapReady] =
    useState(false);

  // ==================== REFS ====================

  const mapRef = useRef<MapView>(null);

  const listRef =
    useRef<FlatList<CompareRow>>(null);

  // ==================== DATA ====================

  const destinationCenter = useMemo(
    () =>
      getDestinationCenter(
        destination.short
      ),
    [destination.short]
  );

  const places = useMemo<MapPlace[]>(() => {
    // Lấy dữ liệu AI gợi ý hiện tại
    const originalPlaces = suggestedPlaces.filter(
      place => place.destinationId === destination.id
    );

    // Chỉ thêm 2 địa điểm demo nếu điểm đến là Hà Nội
    const isHanoi = normalizeName(
      destination.short
    ).includes('ha noi');

    const extraPlaces = isHanoi
      ? createExtraHanoiPlaces(
        originalPlaces,
        destination.id
      )
      : [];

    const combined = [
      ...originalPlaces,
      ...extraPlaces,
    ];

    // Chấm độ phù hợp và sắp xếp
    const scored = combined
      .map(place => ({
        ...place,
        match: getMatchScore(
          place,
          interests
        ),
      }))
      .sort(
        (a, b) => b.match - a.match
      );

    // Thêm rating và tọa độ cho bản đồ
    return scored.map((place, index) => {
      const result = resolveCoordinate(
        place,
        index,
        destinationCenter
      );

      return {
        ...place,
        mapCoordinate: result.coordinate,
        approximate: result.approximate,
        rating: getDemoRating(place),
      };
    });
  }, [
    destination.id,
    destination.short,
    destinationCenter,
    interests,
  ]);

  // Partner hiển thị theo đúng điểm đến đang chọn, không ảnh hưởng kết quả AI.
  const partnerAds = useMemo(
    () => getPartnerAds(destination.short),
    [destination.short]
  );

  const openPartnerAd = (ad: PartnerAd) => {
    if (onPartnerAdPress) {
      onPartnerAdPress(ad);
      return;
    }
    Alert.alert(
      `Ưu đãi từ ${ad.name}`,
      `${ad.category} · ${ad.location}\n\n${ad.description}\n\n${ad.offer} · Giá demo từ ${ad.price}\n\nĐây là quảng cáo minh họa, chưa có đặt dịch vụ hoặc thanh toán thật.`,
      [{ text: 'Đóng' }]
    );
  };

  // ==================== CATEGORIES ====================

  const categories = useMemo(() => {
    const used = Array.from(
      new Set(
        places.map(place => place.category)
      )
    );

    return [
      {
        id: 'all' as const,
        label: 'Tất cả',
        count: places.length,
      },
      ...used.map(id => ({
        id,
        label: suggestionCategoryLabels[id],
        count: places.filter(
          place => place.category === id
        ).length,
      })),
    ];
  }, [places]);

  const visiblePlaces = useMemo(() => {
    if (category === 'all') {
      return places;
    }

    return places.filter(
      place => place.category === category
    );
  }, [category, places]);

  // Dùng cùng số vị trí hiển thị cho AI và Partner (tối đa số AI đang lọc).
  // Không lặp thẻ, không ép kết quả quảng cáo vào thứ hạng AI.
  const displayPartnerAds = useMemo(
    () => partnerAds.slice(0, Math.max(visiblePlaces.length, 1)),
    [partnerAds, visiblePlaces.length]
  );
  const comparisonRows = useMemo<CompareRow[]>(() => {
    const count = Math.max(visiblePlaces.length, displayPartnerAds.length);
    return Array.from({ length: count }, (_, index) => {
      const place = visiblePlaces[index] ?? null;
      const ad = displayPartnerAds[index] ?? null;
      return {
        id: `comparison-${index}-${place?.id ?? 'empty'}-${ad?.id ?? 'empty'}`,
        place,
        ad,
        aiIndex: index,
      };
    });
  }, [visiblePlaces, displayPartnerAds]);

  const selectedPlace =
    places.find(
      place => place.id === selectedId
    ) ?? null;

  const hasApproximateLocations =
    visiblePlaces.some(
      place => place.approximate
    );

  // ==================== MAP HELPERS ====================

  const focusMap = (
    place: MapPlace
  ) => {
    mapRef.current?.animateToRegion(
      {
        ...place.mapCoordinate,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
      },
      400
    );
  };

  const handleMarkerPress = (
    place: MapPlace,
    index: number
  ) => {
    setActiveId(place.id);

    focusMap(place);

    listRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.15,
    });
  };

  // ==================== LIST SCROLL SYNC ====================

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVisible = viewableItems.find(item => item.isViewable);
      const row = firstVisible?.item as CompareRow | undefined;
      const place = row?.place;
      if (!place) return;
      setActiveId(place.id);
      mapRef.current?.animateToRegion(
        { ...place.mapCoordinate, latitudeDelta: 0.035, longitudeDelta: 0.035 },
        400
      );
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  // ==================== UPDATE MAP ====================

  useEffect(() => {
    const first = visiblePlaces[0];

    if (!first) {
      setActiveId(null);
      return;
    }

    setActiveId(first.id);

    if (!mapReady) {
      return;
    }

    if (visiblePlaces.length === 1) {
      mapRef.current?.animateToRegion(
        {
          ...first.mapCoordinate,
          latitudeDelta: 0.035,
          longitudeDelta: 0.035,
        },
        400
      );

      return;
    }

    mapRef.current?.fitToCoordinates(
      visiblePlaces.map(
        place => place.mapCoordinate
      ),
      {
        edgePadding: {
          top: 45,
          right: 45,
          bottom: 45,
          left: 45,
        },
        animated: true,
      }
    );
  }, [
    visiblePlaces,
    mapReady,
  ]);

  // ==================== ANDROID BACK ====================

  useEffect(() => {
    const subscription =
      BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (selectedId) {
            setSelectedId(null);
            return true;
          }

          return false;
        }
      );

    return () => subscription.remove();
  }, [selectedId]);

  // ==================== TOGGLE HELPERS ====================

  const toggle = (
    setter: React.Dispatch<
      React.SetStateAction<string[]>
    >,
    id: string
  ) => {
    setter(previous =>
      previous.includes(id)
        ? previous.filter(
          item => item !== id
        )
        : [...previous, id]
    );
  };

  // ==================== BACK HANDLER ====================

  const handleBack = () => {
    if (planIds.length === 0) {
      onBack();
      return;
    }

    Alert.alert(
      'Bỏ các địa điểm đã chọn?',
      'Kế hoạch của bạn chưa được lưu.',
      [
        {
          text: 'Ở lại',
          style: 'cancel',
        },
        {
          text: 'Bỏ',
          style: 'destructive',
          onPress: onBack,
        },
      ]
    );
  };

  // ==================== RENDER ====================

  return (
    <View className="flex-1">
      <SafeAreaView
        edges={['top', 'bottom']}
        className="flex-1"
        style={{
          backgroundColor: COLORS.white,
        }}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.white}
        />

        {/* ==================== HEADER ==================== */}

        <View className="h-[54px] flex-row items-center px-3">
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center"
            accessibilityLabel="Quay lại"
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color={COLORS.text}
            />
          </Pressable>

          <Text
            className="ml-1 text-[17px] font-bold"
            style={{
              color: COLORS.text,
            }}
          >
            Gợi ý điểm đến cho bạn
          </Text>
        </View>

        {/* ==================== FLOW STEPS ==================== */}

        <View className="flex-row gap-1.5 px-5 pb-2">
          {Array.from(
            { length: FLOW_STEPS },
            (_, index) => (
              <View
                key={index}
                className="h-[5px] flex-1 rounded-full"
                style={{
                  backgroundColor:
                    index < CURRENT_FLOW_STEP
                      ? COLORS.primaryDark
                      : '#E3E8EF',
                }}
              />
            )
          )}
        </View>

        {/* ==================== FIXED MAP ==================== */}

        <View
          style={{
            height: 225,
            backgroundColor: '#E0EEE9',
          }}
        >
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              ...destinationCenter,
              latitudeDelta: 0.12,
              longitudeDelta: 0.12,
            }}
            toolbarEnabled={false}
            showsCompass
            onMapReady={() =>
              setMapReady(true)
            }
          >
            {visiblePlaces.map(
              (place, index) => {
                const active =
                  place.id === activeId;

                return (
                  <Marker
                    key={place.id}
                    coordinate={
                      place.mapCoordinate
                    }
                    title={place.name}
                    description={
                      place.location
                    }
                    onPress={() =>
                      handleMarkerPress(
                        place,
                        index
                      )
                    }
                  >
                    <View
                      style={{
                        width: active
                          ? 42
                          : 34,
                        height: active
                          ? 42
                          : 34,
                        borderRadius: 24,
                        backgroundColor:
                          active
                            ? COLORS.primaryDark
                            : '#12A99A',
                        borderWidth: 3,
                        borderColor:
                        COLORS.white,
                        justifyContent:
                          'center',
                        alignItems:
                          'center',
                        elevation: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: 'white',
                          fontWeight:
                            '800',
                          fontSize: active
                            ? 17
                            : 14,
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>
                  </Marker>
                );
              }
            )}
          </MapView>

          {/* MAP COUNT */}

          <View
            pointerEvents="none"
            className="absolute left-3 top-3 rounded-full bg-white px-3 py-2"
            style={{ elevation: 3 }}
          >
            <Text
              className="text-[11px] font-bold"
              style={{
                color: COLORS.primaryDark,
              }}
            >
              {visiblePlaces.length} địa điểm trên bản đồ
            </Text>
          </View>

          {/* MAP NOTICE */}

          {hasApproximateLocations && (
            <View
              pointerEvents="none"
              className="absolute bottom-2 left-3 rounded-lg bg-white/95 px-2 py-1"
            >
              <Text className="text-[10px] text-[#65798A]">
                Một số marker dùng vị trí mẫu
              </Text>
            </View>
          )}
        </View>

        {/* ==================== FIXED CATEGORY TABS ==================== */}

        {/* Chỉ lọc danh sách AI; không can thiệp quảng cáo Partner */}

        <View className="border-b border-[#EEF1F5] bg-white py-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 8,
              alignItems: 'center',
            }}
          >
            {categories.map(item => {
              const selected =
                item.id === category;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setCategory(item.id);

                    listRef.current?.scrollToOffset({
                      offset: 0,
                      animated: false,
                    });
                  }}
                  className="rounded-full px-4 py-2.5"
                  style={{
                    backgroundColor:
                      selected
                        ? COLORS.primaryDark
                        : COLORS.lightPurple,
                  }}
                >
                  <Text
                    className="text-[12px] font-semibold"
                    style={{
                      color:
                        selected
                          ? COLORS.white
                          : COLORS.text,
                    }}
                  >
                    {item.label} ({item.count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ==================== FAIR 50/50 SPLIT LIST ==================== */}

        <FlatList
          ref={listRef}
          className="flex-1"
          data={comparisonRows}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          onScrollToIndexFailed={info => {
            listRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: true,
            });
          }}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 22 }}
          ListHeaderComponent={
            <View>
              <View className="mb-3 mt-3 rounded-2xl bg-[#E9F7F4] p-3">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="view-grid-outline" size={18} color={COLORS.primaryDark} />
                  <Text className="ml-2 flex-1 text-[12px] font-bold" style={{ color: COLORS.primaryDark }}>
                    Gợi ý & dịch vụ dành cho bạn
                  </Text>
                </View>
                <Text className="mt-1 text-[11px] leading-[16px]" style={{ color: COLORS.muted }}>
                  Cùng khám phá điểm đến phù hợp và dịch vụ từ đối tác. Mỗi loại được hiển thị riêng, dễ so sánh.
                </Text>
                <Text className="mt-1 text-[10px]" style={{ color: COLORS.muted }}>
                  Danh mục chỉ lọc kết quả AI • Ưu đãi đối tác đang dùng dữ liệu demo.
                </Text>
              </View>

              <View className="mb-3 flex-row" style={{ gap: 10 }}>
                <View className="min-w-0 flex-1 rounded-2xl border border-[#DDEDE7] bg-[#F4FBF8] px-3 py-3">
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="creation" size={16} color={COLORS.primaryDark} />
                    <Text className="ml-1.5 text-[13px] font-extrabold" style={{ color: COLORS.text }}>
                      Địa điểm đề xuất
                    </Text>
                  </View>
                  <Text className="mt-1 text-[10px]" style={{ color: COLORS.muted }}>
                    {visiblePlaces.length} địa điểm • Theo sở thích
                  </Text>
                </View>
                <View className="min-w-0 flex-1 rounded-2xl border border-[#E4E9ED] bg-[#F6F8FA] px-3 py-3">
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="storefront-outline" size={16} color={COLORS.primaryDark} />
                    <Text className="ml-1.5 text-[13px] font-extrabold" style={{ color: COLORS.text }}>
                      Đối tác
                    </Text>
                  </View>
                  <Text className="mt-1 text-[10px]" style={{ color: COLORS.muted }}>
                    {displayPartnerAds.length} dịch vụ • Tài trợ
                  </Text>
                </View>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View className="mb-3 flex-row" style={{ gap: 10 }}>
              {item.place ? (
                <MatchCard
                  place={item.place}
                  index={item.aiIndex}
                  favorite={favorites.includes(item.place.id)}
                  inPlan={planIds.includes(item.place.id)}
                  active={item.place.id === activeId}
                  onPress={() => {
                    if (!item.place) return;
                    setActiveId(item.place.id);
                    focusMap(item.place);
                    setSelectedId(item.place.id);
                  }}
                  onToggleFavorite={() => item.place && toggle(setFavorites, item.place.id)}
                  onTogglePlan={() => item.place && toggle(setPlanIds, item.place.id)}
                />
              ) : (
                <EmptyColumnCard label="Không có địa điểm AI trong danh mục này" />
              )}

              {item.ad ? (
                <SponsoredCard ad={item.ad} onPress={() => item.ad && openPartnerAd(item.ad)} />
              ) : (
                <EmptyColumnCard label="Đã xem hết ưu đãi được tài trợ" />
              )}
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center rounded-2xl bg-[#F8F8FF] px-4 py-8">
              <MaterialCommunityIcons name="map-search-outline" size={32} color="#94B5B6" />
              <Text className="mt-2 text-[12px]" style={{ color: COLORS.muted }}>
                Chưa có kết quả để hiển thị.
              </Text>
            </View>
          }
        />

        {/* ==================== FIXED FOOTER ==================== */}

        <View className="border-t border-[#EEF1F5] bg-white px-4 pb-2 pt-2.5">
          <Pressable
            onPress={() =>
              onSavePlan(planIds)
            }
            disabled={
              planIds.length === 0
            }
            className="h-12 flex-row items-center justify-center rounded-full active:opacity-80"
            style={{
              backgroundColor:
                planIds.length > 0
                  ? COLORS.primaryDark
                  : '#E3E8EF',
            }}
          >
            <MaterialCommunityIcons
              name="content-save-check-outline"
              size={19}
              color={
                planIds.length > 0
                  ? 'white'
                  : COLORS.muted
              }
            />

            <Text
              className="ml-2 text-[14px] font-bold"
              style={{
                color:
                  planIds.length > 0
                    ? 'white'
                    : COLORS.muted,
              }}
            >
              {planIds.length > 0
                ? `Lưu kế hoạch (${planIds.length} địa điểm)`
                : 'Chọn địa điểm để thêm vào kế hoạch'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* ==================== DETAIL OVERLAY ==================== */}

      {selectedPlace && (
        <View style={StyleSheet.absoluteFill}>
          <SuggestionDetailScreen
            place={selectedPlace}
            matchScore={
              selectedPlace.match
            }
            interests={
              interests
            }
            favorite={
              favorites.includes(
                selectedPlace.id
              )
            }
            inPlan={
              planIds.includes(
                selectedPlace.id
              )
            }
            planCount={
              planIds.length
            }
            onBack={() =>
              setSelectedId(null)
            }
            onToggleFavorite={() =>
              toggle(
                setFavorites,
                selectedPlace.id
              )
            }
            onTogglePlan={() =>
              toggle(
                setPlanIds,
                selectedPlace.id
              )
            }
          />
        </View>
      )}
    </View>
  );
}
