
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
  interestTagLabels,
  suggestedPlaces,
  suggestionCategoryLabels,
  type SuggestedPlace,
  type SuggestionCategory,
} from '../../constants/suggestedPlaces';

import SuggestionDetailScreen from './SuggestionDetailScreen';

// ==================== TYPES ====================

type IconName =
  React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type SuggestedPlacesScreenProps = {
  destinationId: string;
  interests: string[];
  onBack: () => void;
  onSavePlan: (placeIds: string[]) => void;
};

type MapPlace = SuggestedPlace & {
  match: number;
  rating: number;
  mapCoordinate: LatLng;
  approximate: boolean;
};

type PlaceWithCoordinate = SuggestedPlace & {
  coordinate?: LatLng;
  latitude?: number;
  longitude?: number;
  rating?: number;
};

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

const tagIcons: Record<string, IconName> = {
  beach: 'beach',
  food: 'food-outline',
  culture: 'bank-outline',
  nature: 'image-filter-hdr',
  shopping: 'shopping-outline',
  adventure: 'hiking',
  relax: 'spa-outline',
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

// ==================== RATING COMPONENT ====================

function RatingStars({
                       rating,
                     }: {
  rating: number;
}) {
  const safeRating = Math.max(
    0,
    Math.min(5, rating)
  );

  return (
    <View className="flex-row items-center">
      {[0, 1, 2, 3, 4].map(index => {
        const remaining = safeRating - index;

        const iconName: IconName =
          remaining >= 0.75
            ? 'star'
            : remaining >= 0.25
              ? 'star-half-full'
              : 'star-outline';

        return (
          <MaterialCommunityIcons
            key={index}
            name={iconName}
            size={19}
            color={COLORS.star}
            style={{ marginRight: 1 }}
          />
        );
      })}

      <Text
        className="ml-1 text-[13px] font-extrabold"
        style={{ color: COLORS.star }}
      >
        {safeRating.toFixed(1)}
      </Text>
    </View>
  );
}

// ==================== SUGGESTION CARD ====================

function SuggestionCard({
                          place,
                          index,
                          best,
                          favorite,
                          inPlan,
                          active,
                          onPress,
                          onToggleFavorite,
                        }: {
  place: MapPlace;
  index: number;
  best: boolean;
  favorite: boolean;
  inPlan: boolean;
  active: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 overflow-hidden rounded-[20px] bg-white"
      style={{
        borderWidth: active ? 2 : 1,
        borderColor: active
          ? COLORS.primary
          : COLORS.border,
        elevation: active ? 3 : 2,
      }}
    >
      {/* ==================== IMAGE ==================== */}

      <ImageBackground
        source={{ uri: place.image }}
        style={{ height: 145 }}
      >
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.05)',
            'rgba(0,0,0,0.68)',
          ]}
          style={{
            flex: 1,
            padding: 12,
            justifyContent: 'space-between',
          }}
        >
          {/* BADGES */}

          <View className="flex-row items-start justify-between">
            <View className="flex-1 flex-row flex-wrap items-center gap-1.5">
              {/* NUMBER */}

              <View
                className="h-7 w-7 items-center justify-center rounded-full"
                style={{
                  backgroundColor: active
                    ? COLORS.primaryDark
                    : '#12A99A',
                  borderWidth: 1,
                  borderColor: 'white',
                }}
              >
                <Text className="text-[12px] font-extrabold text-white">
                  {index + 1}
                </Text>
              </View>

              {best && (
                <View className="flex-row items-center rounded-full bg-[#FFF1C7] px-2 py-1">
                  <MaterialCommunityIcons
                    name="star"
                    size={12}
                    color="#D99A00"
                  />

                  <Text className="ml-1 text-[10px] font-bold text-[#7A5600]">
                    Phù hợp nhất
                  </Text>
                </View>
              )}

              {inPlan && (
                <View
                  className="flex-row items-center rounded-full px-2 py-1"
                  style={{
                    backgroundColor: COLORS.mint,
                  }}
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={12}
                    color={COLORS.primaryDark}
                  />

                  <Text
                    className="ml-1 text-[10px] font-bold"
                    style={{
                      color: COLORS.primaryDark,
                    }}
                  >
                    Trong kế hoạch
                  </Text>
                </View>
              )}
            </View>

            {/* FAVORITE */}

            <Pressable
              onPress={event => {
                event.stopPropagation();
                onToggleFavorite();
              }}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full bg-white/90"
              accessibilityLabel={
                favorite ? 'Bỏ yêu thích' : 'Yêu thích'
              }
            >
              <MaterialCommunityIcons
                name={
                  favorite ? 'heart' : 'heart-outline'
                }
                size={18}
                color={
                  favorite
                    ? COLORS.heart
                    : COLORS.text
                }
              />
            </Pressable>
          </View>

          {/* TITLE */}

          <View className="flex-row items-end justify-between">
            <View className="min-w-0 flex-1 pr-2">
              <Text
                numberOfLines={1}
                className="text-[18px] font-extrabold text-white"
              >
                {place.name}
              </Text>

              <View className="mt-1 flex-row items-center">
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={13}
                  color="white"
                />

                <Text
                  numberOfLines={1}
                  className="ml-1 text-[11px] text-white"
                >
                  {place.location}
                </Text>
              </View>
            </View>

            <View
              className="rounded-full px-2.5 py-1"
              style={{
                backgroundColor: COLORS.mint,
              }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{
                  color: COLORS.primaryDark,
                }}
              >
                {place.match}% phù hợp
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* ==================== RATING ==================== */}

      <View className="flex-row items-center justify-between px-3 pb-2 pt-3">
        <RatingStars rating={place.rating} />

        <View className="flex-row items-center">
          <MaterialCommunityIcons
            name="star-four-points-outline"
            size={14}
            color={COLORS.primary}
          />

          <Text
            className="ml-1 text-[10px] font-semibold"
            style={{ color: COLORS.primaryDark }}
          >
            AI đề xuất
          </Text>
        </View>
      </View>

      {/* ==================== TAGS ==================== */}

      <View className="flex-row flex-wrap gap-3 px-3 pb-3">
        {place.tags.slice(0, 3).map(tag => (
          <View
            key={tag}
            className="flex-row items-center"
          >
            <MaterialCommunityIcons
              name={
                tagIcons[tag] ?? 'tag-outline'
              }
              size={15}
              color={COLORS.primary}
            />

            <Text
              className="ml-1 text-[11px]"
              style={{
                color: COLORS.text,
              }}
            >
              {interestTagLabels[tag] ?? tag}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

// ==================== MAIN SCREEN ====================

export default function SuggestedPlacesScreen({
                                                destinationId,
                                                interests,
                                                onBack,
                                                onSavePlan,
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
    useRef<FlatList<MapPlace>>(null);

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
    ({
       viewableItems,
     }: {
      viewableItems: ViewToken[];
    }) => {
      const visible = viewableItems.find(
        item => item.isViewable
      );

      const place = visible?.item as
        | MapPlace
        | undefined;

      if (!place) {
        return;
      }

      setActiveId(place.id);

      mapRef.current?.animateToRegion(
        {
          ...place.mapCoordinate,
          latitudeDelta: 0.035,
          longitudeDelta: 0.035,
        },
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

        {/* Thanh này NẰM NGOÀI FlatList để không trôi khi cuộn */}

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

        {/* ==================== SCROLLABLE PLACE LIST ==================== */}

        <FlatList
          ref={listRef}
          className="flex-1"
          data={visiblePlaces}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          viewabilityConfig={
            viewabilityConfig
          }
          onViewableItemsChanged={
            onViewableItemsChanged
          }
          onScrollToIndexFailed={info => {
            listRef.current?.scrollToOffset({
              offset:
                info.averageItemLength *
                info.index,
              animated: true,
            });
          }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 20,
          }}

          // Chỉ để lời giới thiệu và tiêu đề trong vùng cuộn.
          // Category đã được chuyển ra ngoài.

          ListHeaderComponent={
            <View>
              {/* INTRO */}

              <View
                className="mt-3 flex-row items-center rounded-2xl p-3"
                style={{
                  backgroundColor:
                    '#E8F8F5',
                }}
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    backgroundColor:
                    COLORS.mint,
                  }}
                >
                  <MaterialCommunityIcons
                    name="star-four-points"
                    size={20}
                    color={
                      COLORS.primaryDark
                    }
                  />
                </View>

                <Text
                  className="ml-3 flex-1 text-[12px] leading-[18px]"
                  style={{
                    color: COLORS.text,
                  }}
                >
                  Dựa trên sở thích của bạn,
                  đây là những địa điểm phù
                  hợp tại{' '}
                  <Text
                    className="font-bold"
                    style={{
                      color:
                      COLORS.primaryDark,
                    }}
                  >
                    {destination.short}
                  </Text>
                  .
                </Text>
              </View>

              {/* LIST TITLE */}

              <View className="mb-3 mt-4 flex-row items-center justify-between">
                <Text
                  className="text-[16px] font-extrabold"
                  style={{
                    color: COLORS.text,
                  }}
                >
                  Địa điểm AI gợi ý
                </Text>

                <Text
                  className="text-[11px]"
                  style={{
                    color: COLORS.muted,
                  }}
                >
                  Vuốt để xem
                </Text>
              </View>
            </View>
          }

          renderItem={({
                         item,
                         index,
                       }) => (
            <SuggestionCard
              place={item}
              index={index}
              best={
                item.id ===
                places[0]?.id
              }
              favorite={
                favorites.includes(
                  item.id
                )
              }
              inPlan={
                planIds.includes(
                  item.id
                )
              }
              active={
                item.id ===
                activeId
              }
              onPress={() => {
                setActiveId(
                  item.id
                );

                focusMap(item);

                setSelectedId(
                  item.id
                );
              }}
              onToggleFavorite={() =>
                toggle(
                  setFavorites,
                  item.id
                )
              }
            />
          )}

          ListEmptyComponent={
            <View className="items-center rounded-xl bg-[#F8F8FF] px-4 py-8">
              <MaterialCommunityIcons
                name="map-search-outline"
                size={36}
                color="#94B5B6"
              />

              <Text className="mt-2 text-[12px] text-[#6F8090]">
                Không có địa điểm phù hợp
                với danh mục này.
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
