
import React, { useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import SelectedPlacesScreen from './SelectedPlacesScreen';

import {
  getMatchLabel,
  interestTagLabels,
  type SuggestedPlace,
} from '../../constants/suggestedPlaces';

// ==================== TYPES ====================

type IconName =
  React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type DetailTab = 'intro' | 'reviews' | 'photos' | 'mentions';

type PhotoFilter = 'all' | 'cover' | 'highlights';

type PhotoItem = {
  id: string;
  uri: string;
  name: string;
  kind: 'cover' | 'highlights';
};

type PhotoViewer =
  | { mode: 'gallery' }
  | {
  mode: 'preview';
  uri: string;
  fromGallery: boolean;
}
  | null;

type SuggestionDetailScreenProps = {
  place: SuggestedPlace;
  matchScore: number;
  interests: string[];
  favorite: boolean;
  inPlan: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
  onTogglePlan: () => void;
  onViewPlan?: () => void;
  planCount?: number;
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
  orange: '#F59E38',
};

// ==================== TABS ====================

const DETAIL_TABS: {
  id: DetailTab;
  label: string;
}[] = [
  { id: 'intro', label: 'Giới thiệu' },
  { id: 'reviews', label: 'Đánh giá' },
  { id: 'photos', label: 'Ảnh' },
  { id: 'mentions', label: 'Đề cập' },
];

// ==================== PHOTO FILTERS ====================

const PHOTO_FILTERS: {
  id: PhotoFilter;
  label: string;
}[] = [
  { id: 'all', label: 'Tất cả ảnh' },
  { id: 'cover', label: 'Ảnh chính' },
  { id: 'highlights', label: 'Điểm nổi bật' },
];

// ==================== RATING ====================

function RatingStars({
                       rating,
                       size = 19,
                     }: {
  rating: number;
  size?: number;
}) {
  const score = Math.max(0, Math.min(5, rating));

  return (
    <View className="flex-row items-center">
      {[0, 1, 2, 3, 4].map(index => {
        const remaining = score - index;

        const name: IconName =
          remaining >= 0.75
            ? 'star'
            : remaining >= 0.25
              ? 'star-half-full'
              : 'star-outline';

        return (
          <MaterialCommunityIcons
            key={index}
            name={name}
            size={size}
            color={COLORS.orange}
          />
        );
      })}

      <Text
        className="ml-2 text-[14px] font-extrabold"
        style={{ color: COLORS.orange }}
      >
        {score.toFixed(1)}
      </Text>
    </View>
  );
}

// ==================== MAIN SCREEN ====================

export default function SuggestionDetailScreen({
                                                 place,
                                                 matchScore,
                                                 interests,
                                                 favorite,
                                                 inPlan,
                                                 onBack,
                                                 onToggleFavorite,
                                                 onTogglePlan,
                                                 planCount,
                                               }: SuggestionDetailScreenProps) {
  const { width } = useWindowDimensions();

  const mainScrollRef = useRef<ScrollView>(null);

  // ==================== STATES ====================

  const [imageIndex, setImageIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  const [activeTab, setActiveTab] =
    useState<DetailTab>('intro');

  const [photoFilter, setPhotoFilter] =
    useState<PhotoFilter>('all');

  const [photoViewer, setPhotoViewer] =
    useState<PhotoViewer>(null);

  const [showSelectedPlaces, setShowSelectedPlaces] =
    useState(false);

  const [scrolledPastHero, setScrolledPastHero] =
    useState(false);

  // ==================== PHOTO DATA ====================

  // Dùng chính ảnh của địa điểm và ảnh điểm nổi bật.
  // Không dùng ảnh hardcode từ địa điểm khác.

  const photoItems: PhotoItem[] = [
    {
      id: 'cover',
      uri: place.image,
      name: place.name,
      kind: 'cover',
    },

    ...place.highlights.map((item, index) => ({
      id: `highlight-${index}`,
      uri: item.image,
      name: item.name,
      kind: 'highlights' as const,
    })),
  ];

  const filteredPhotos = photoItems.filter(
    item =>
      photoFilter === 'all' ||
      item.kind === photoFilter
  );

  const gallery = photoItems.map(item => item.uri);

  const mainPhoto = filteredPhotos[0];
  const rightTop = filteredPhotos[1];
  const rightBottom = filteredPhotos[2];

  // ==================== RATING DATA ====================

  const ratingSource = place as SuggestedPlace & {
    rating?: number;
  };

  const rating =
    typeof ratingSource.rating === 'number' &&
    Number.isFinite(ratingSource.rating)
      ? ratingSource.rating
      : 4.5;

  // ==================== USEFUL INFO ====================

  const infoRows: {
    icon: IconName;
    label: string;
    value: string;
  }[] = [
    {
      icon: 'clock-outline',
      label: 'Giờ mở cửa',
      value: place.info.openHours,
    },
    {
      icon: 'ticket-outline',
      label: 'Giá vé',
      value: place.info.price,
    },
    {
      icon: 'timer-sand',
      label: 'Thời gian gợi ý',
      value: place.info.duration,
    },
    {
      icon: 'weather-sunny',
      label: 'Thời điểm đẹp nhất',
      value: place.info.bestTime,
    },
  ];

  // ==================== HANDLERS ====================

  const changeTab = (tab: DetailTab) => {
    setActiveTab(tab);

    mainScrollRef.current?.scrollTo({
      y: 300,
      animated: true,
    });
  };

  // Mở một ảnh ở chế độ toàn màn hình
  const openPhoto = (
    uri: string,
    fromGallery = false
  ) => {
    setPhotoViewer({
      mode: 'preview',
      uri,
      fromGallery,
    });
  };

  // Quay lại thư viện hoặc đóng trình xem ảnh
  const closePhotoViewer = () => {
    if (
      photoViewer?.mode === 'preview' &&
      photoViewer.fromGallery
    ) {
      setPhotoViewer({ mode: 'gallery' });
    } else {
      setPhotoViewer(null);
    }
  };

  // ==================== SELECTED PLACES ====================

  if (showSelectedPlaces) {
    return (
      <SelectedPlacesScreen
        onBack={() => setShowSelectedPlaces(false)}
      />
    );
  }

  // ==================== RENDER ====================

  return (
    <SafeAreaView
      edges={['bottom']}
      className="flex-1"
      style={{ backgroundColor: COLORS.white }}
    >
      <StatusBar
        barStyle={
          scrolledPastHero
            ? 'dark-content'
            : 'light-content'
        }
      />

      {/* ==================== MAIN SCROLL ==================== */}

      <ScrollView
        ref={mainScrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        bounces={false}
        stickyHeaderIndices={[1]}
        scrollEventThrottle={16}
        onScroll={event => {
          const passed =
            event.nativeEvent.contentOffset.y > 245;

          if (passed !== scrolledPastHero) {
            setScrolledPastHero(passed);
          }
        }}
      >
        {/* ==================== HERO GALLERY ==================== */}

        <View style={{ height: 300 }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={event => {
              setImageIndex(
                Math.round(
                  event.nativeEvent.contentOffset.x /
                  width
                )
              );
            }}
          >
            {gallery.map((uri, index) => (
              <ImageBackground
                key={`${index}-${uri}`}
                source={{ uri }}
                style={{ width, height: 300 }}
              />
            ))}
          </ScrollView>

          {/* HEADER NỔI TRÊN ẢNH */}

          <SafeAreaView
            edges={['top']}
            className="absolute left-0 right-0 top-0"
          >
            <View className="flex-row items-center justify-between px-4 pt-2">
              <View className="flex-row items-center">
                <Pressable
                  onPress={onBack}
                  className="h-9 w-9 items-center justify-center rounded-full bg-white/90"
                  accessibilityLabel="Quay lại"
                >
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={26}
                    color={COLORS.text}
                  />
                </Pressable>

                <Text
                  className="ml-2.5 text-[15px] font-bold text-white"
                  style={{
                    textShadowColor:
                      'rgba(0,0,0,0.5)',
                    textShadowRadius: 6,
                  }}
                >
                  Chi tiết gợi ý điểm đến
                </Text>
              </View>

              {/* FAVORITE */}

              <Pressable
                onPress={onToggleFavorite}
                className="h-9 w-9 items-center justify-center rounded-full bg-white"
                accessibilityLabel={
                  favorite ? 'Bỏ yêu thích' : 'Yêu thích'
                }
              >
                <MaterialCommunityIcons
                  name={
                    favorite ? 'heart' : 'heart-outline'
                  }
                  size={20}
                  color={
                    favorite
                      ? COLORS.heart
                      : COLORS.text
                  }
                />
              </Pressable>
            </View>
          </SafeAreaView>

          {/* IMAGE DOTS */}

          <View className="absolute bottom-7 left-0 right-0 flex-row justify-center gap-1.5">
            {gallery.map((_, index) => (
              <View
                key={`dot-${index}`}
                className="h-1.5 rounded-full"
                style={{
                  width:
                    index === imageIndex ? 16 : 6,
                  backgroundColor:
                    index === imageIndex
                      ? COLORS.white
                      : 'rgba(255,255,255,0.6)',
                }}
              />
            ))}
          </View>
        </View>

        {/* ==================== STICKY TAB BAR ==================== */}

        <View
          className="bg-white"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: '#EDF0F5',
            elevation: 2,
          }}
        >
          <View className="flex-row justify-around px-2">
            {DETAIL_TABS.map(tab => {
              const selected = activeTab === tab.id;

              return (
                <Pressable
                  key={tab.id}
                  onPress={() => changeTab(tab.id)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 14,
                    borderBottomWidth: 2,
                    borderBottomColor: selected
                      ? COLORS.primary
                      : 'transparent',
                  }}
                >
                  <Text
                    className="text-[12px] font-bold"
                    style={{
                      color: selected
                        ? COLORS.primary
                        : COLORS.text,
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ==================== TAB CONTENT ==================== */}

        <View className="min-h-[350px] bg-white px-4 pb-8 pt-4">

          {/* ============================================
              TAB GIỚI THIỆU
          ============================================ */}

          {activeTab === 'intro' && (
            <View>

              {/* MATCH SCORE */}

              <View className="flex-row gap-2.5">
                <View
                  className="flex-1 rounded-2xl p-3"
                  style={{
                    backgroundColor: COLORS.background,
                  }}
                >
                  <Text
                    className="text-[11px] font-semibold"
                    style={{ color: COLORS.text }}
                  >
                    Độ phù hợp với bạn
                  </Text>

                  <Text
                    className="mt-0.5 text-[20px] font-extrabold"
                    style={{
                      color: COLORS.primaryDark,
                    }}
                  >
                    {matchScore}%
                  </Text>

                  <View className="mt-1.5 h-[6px] overflow-hidden rounded-full bg-[#DDE4EC]">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${
                          Math.min(
                            100,
                            Math.max(0, matchScore)
                          )
                        }%`,
                        backgroundColor:
                        COLORS.primaryDark,
                      }}
                    />
                  </View>
                </View>

                <View className="flex-1 flex-row rounded-2xl bg-[#E2FAF5] p-3">
                  <View
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: COLORS.mint,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="star-four-points"
                      size={18}
                      color={COLORS.primaryDark}
                    />
                  </View>

                  <View className="ml-2 flex-1">
                    <Text
                      className="text-[13px] font-bold"
                      style={{
                        color: COLORS.primaryDark,
                      }}
                    >
                      {getMatchLabel(matchScore)}
                    </Text>

                    <Text
                      className="mt-0.5 text-[10px]"
                      style={{ color: COLORS.muted }}
                    >
                      Dựa trên sở thích, ngân sách và phong cách của bạn
                    </Text>
                  </View>
                </View>
              </View>

              {/* PLACE NAME */}

              <Text
                className="mt-4 text-[22px] font-extrabold"
                style={{ color: COLORS.text }}
              >
                {place.name}
              </Text>

              {/* RATING */}

              <View className="mt-2">
                <RatingStars rating={rating} />

                <Text className="mt-1 text-[10px] text-[#8B97A4]">
                  Điểm đánh giá minh họa
                </Text>
              </View>

              {/* LOCATION */}

              <View className="mt-2 flex-row items-center">
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={16}
                  color={COLORS.primary}
                />

                <Text
                  className="ml-1 flex-1 text-[13px]"
                  style={{ color: COLORS.muted }}
                >
                  {place.location}
                </Text>
              </View>

              {/* DESCRIPTION */}

              <Text
                className="mt-3 text-[13px] leading-5"
                style={{ color: '#4A5A66' }}
              >
                {place.description}
              </Text>

              {/* HIGHLIGHTS */}

              <Text
                className="mb-2 mt-5 text-[15px] font-bold"
                style={{ color: COLORS.text }}
              >
                Điểm nổi bật
              </Text>

              <View className="flex-row gap-2">
                {place.highlights.map((item, index) => (
                  <View
                    key={`${item.name}-${index}`}
                    className="flex-1"
                  >
                    <Pressable
                      onPress={() => openPhoto(item.image)}
                    >
                      <Image
                        source={{ uri: item.image }}
                        className="h-[72px] w-full rounded-xl"
                      />
                    </Pressable>

                    <Text
                      numberOfLines={2}
                      className="mt-1 text-center text-[11px]"
                      style={{ color: COLORS.text }}
                    >
                      {item.name}
                    </Text>
                  </View>
                ))}
              </View>

              {/* INTEREST TAGS */}

              <Text
                className="mb-2 mt-5 text-[15px] font-bold"
                style={{ color: COLORS.text }}
              >
                Phù hợp với sở thích của bạn
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {place.tags.map(tag => {
                  const matched =
                    interests.includes(tag);

                  return (
                    <View
                      key={tag}
                      className="flex-row items-center rounded-full px-3 py-1.5"
                      style={{
                        backgroundColor: matched
                          ? COLORS.mint
                          : COLORS.lightPurple,
                      }}
                    >
                      <MaterialCommunityIcons
                        name={
                          matched
                            ? 'check-circle'
                            : 'tag-outline'
                        }
                        size={13}
                        color={
                          matched
                            ? COLORS.primaryDark
                            : COLORS.muted
                        }
                      />

                      <Text
                        className="ml-1 text-[12px] font-semibold"
                        style={{
                          color: matched
                            ? COLORS.primaryDark
                            : '#445577',
                        }}
                      >
                        {interestTagLabels[tag] ?? tag}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* USEFUL INFO */}

              <View
                className="mt-5 overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: COLORS.background,
                }}
              >
                <Pressable
                  onPress={() =>
                    setShowInfo(previous => !previous)
                  }
                  className="flex-row items-center justify-between px-4 py-3.5"
                >
                  <Text
                    className="text-[14px] font-bold"
                    style={{ color: COLORS.text }}
                  >
                    Thông tin hữu ích
                  </Text>

                  <MaterialCommunityIcons
                    name={
                      showInfo
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={22}
                    color={COLORS.text}
                  />
                </Pressable>

                {showInfo && (
                  <View className="px-4 pb-3">
                    {infoRows.map(row => (
                      <View
                        key={row.label}
                        className="flex-row items-center border-t border-[#E6E9F2] py-2.5"
                      >
                        <MaterialCommunityIcons
                          name={row.icon}
                          size={18}
                          color={COLORS.primary}
                        />

                        <Text
                          className="ml-2 flex-1 text-[12px]"
                          style={{ color: COLORS.muted }}
                        >
                          {row.label}
                        </Text>

                        <Text
                          className="max-w-[55%] text-right text-[12px] font-bold"
                          style={{ color: COLORS.text }}
                        >
                          {row.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ============================================
              TAB ĐÁNH GIÁ
          ============================================ */}

          {activeTab === 'reviews' && (
            <View>
              <Text
                className="text-[20px] font-extrabold"
                style={{ color: COLORS.text }}
              >
                Đánh giá địa điểm
              </Text>

              <View className="mt-4 items-center rounded-2xl bg-[#F8F8FF] px-4 py-7">
                <Text
                  className="text-[42px] font-extrabold"
                  style={{ color: COLORS.text }}
                >
                  {rating.toFixed(1)}
                </Text>

                <RatingStars
                  rating={rating}
                  size={24}
                />

                <Text className="mt-3 text-[12px] text-[#7D8CA2]">
                  Điểm rating mẫu để demo giao diện
                </Text>
              </View>

              <Text
                className="mb-3 mt-6 text-[16px] font-bold"
                style={{ color: COLORS.text }}
              >
                Nhận xét từ du khách
              </Text>

              <View className="items-center rounded-2xl border border-[#E8EBF5] bg-white px-5 py-8">
                <MaterialCommunityIcons
                  name="comment-text-outline"
                  size={38}
                  color="#A7B8C8"
                />

                <Text
                  className="mt-3 text-center text-[13px] font-semibold"
                  style={{ color: COLORS.text }}
                >
                  Chưa có dữ liệu đánh giá thực tế
                </Text>

                <Text className="mt-2 text-center text-[12px] leading-5 text-[#8494A7]">
                  Sau khi kết nối dịch vụ dữ liệu địa điểm,
                  các đánh giá và nhận xét sẽ được hiển thị
                  tại đây.
                </Text>
              </View>
            </View>
          )}

          {/* ============================================
              TAB ẢNH - LAYOUT MỚI GIỐNG WANDERLOG
          ============================================ */}

          {activeTab === 'photos' && (
            <View>

              <Text
                className="text-[19px] font-extrabold"
                style={{ color: COLORS.text }}
              >
                Hình ảnh {place.name}
              </Text>

              <Text
                className="mb-3 mt-1 text-[11px]"
                style={{ color: COLORS.muted }}
              >
                {photoItems.length} hình ảnh từ dữ liệu địa điểm
              </Text>

              {/* PHOTO FILTER CHIPS */}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
                contentContainerStyle={{
                  gap: 7,
                  alignItems: 'center',
                }}
              >
                {PHOTO_FILTERS.map(filter => {
                  const selected =
                    photoFilter === filter.id;

                  return (
                    <Pressable
                      key={filter.id}
                      onPress={() =>
                        setPhotoFilter(filter.id)
                      }
                      className="rounded-full px-3 py-2"
                      style={{
                        backgroundColor: selected
                          ? '#DDF7F1'
                          : '#EEF0F4',
                      }}
                    >
                      <Text
                        className="text-[12px] font-semibold"
                        style={{
                          color: selected
                            ? COLORS.primaryDark
                            : '#637184',
                        }}
                      >
                        {filter.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* PHOTO COLLAGE: 1 LARGE + 2 SMALL */}

              {mainPhoto ? (
                <View
                  style={{
                    height: 260,
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  {/* LEFT LARGE PHOTO */}

                  <Pressable
                    onPress={() =>
                      openPhoto(mainPhoto.uri)
                    }
                    style={{
                      flex: rightTop ? 2.3 : 1,
                      overflow: 'hidden',
                      borderRadius: 8,
                    }}
                  >
                    <Image
                      source={{ uri: mainPhoto.uri }}
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                      resizeMode="cover"
                    />
                  </Pressable>

                  {/* RIGHT SMALL PHOTOS */}

                  {rightTop && (
                    <View
                      style={{
                        flex: 1,
                        gap: 8,
                      }}
                    >
                      {/* RIGHT TOP PHOTO */}

                      <Pressable
                        onPress={() =>
                          openPhoto(rightTop.uri)
                        }
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          borderRadius: 8,
                        }}
                      >
                        <Image
                          source={{ uri: rightTop.uri }}
                          style={{
                            width: '100%',
                            height: '100%',
                          }}
                          resizeMode="cover"
                        />
                      </Pressable>

                      {/* RIGHT BOTTOM PHOTO */}

                      {rightBottom ? (
                        <View
                          style={{
                            flex: 1,
                            overflow: 'hidden',
                            borderRadius: 8,
                          }}
                        >
                          <Pressable
                            onPress={() =>
                              openPhoto(rightBottom.uri)
                            }
                            style={{ flex: 1 }}
                          >
                            <Image
                              source={{
                                uri: rightBottom.uri,
                              }}
                              style={{
                                width: '100%',
                                height: '100%',
                              }}
                              resizeMode="cover"
                            />
                          </Pressable>

                          {/* OVERLAY: XEM TẤT CẢ ẢNH */}

                          <Pressable
                            onPress={() =>
                              setPhotoViewer({
                                mode: 'gallery',
                              })
                            }
                            accessibilityLabel="Xem tất cả ảnh"
                            style={{
                              position: 'absolute',
                              bottom: 8,
                              left: 4,
                              right: 4,
                              paddingVertical: 8,
                              paddingHorizontal: 2,
                              borderRadius: 20,
                              backgroundColor:
                                'rgba(255,255,255,0.95)',
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                color: COLORS.text,
                                fontSize: 10,
                                fontWeight: '700',
                              }}
                            >
                              Xem tất cả ảnh
                            </Text>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() =>
                            setPhotoViewer({
                              mode: 'gallery',
                            })
                          }
                          style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 8,
                            backgroundColor:
                            COLORS.lightPurple,
                          }}
                        >
                          <MaterialCommunityIcons
                            name="image-multiple"
                            size={22}
                            color={COLORS.primaryDark}
                          />

                          <Text
                            className="mt-1 text-center text-[11px] font-bold"
                            style={{
                              color: COLORS.primaryDark,
                            }}
                          >
                            Xem tất cả ảnh
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <View className="items-center rounded-2xl bg-[#F3F4F6] px-4 py-8">
                  <Text
                    className="text-[13px]"
                    style={{ color: COLORS.muted }}
                  >
                    Chưa có ảnh trong danh mục này.
                  </Text>
                </View>
              )}

              {/* VIEW ALL PHOTOS BUTTON */}

              <Pressable
                onPress={() =>
                  setPhotoViewer({
                    mode: 'gallery',
                  })
                }
                className="mt-4 flex-row items-center justify-center rounded-full border border-[#B8EAE3] bg-[#F0FCF9] py-3"
              >
                <MaterialCommunityIcons
                  name="image-multiple-outline"
                  size={19}
                  color={COLORS.primaryDark}
                />

                <Text
                  className="ml-2 text-[13px] font-bold"
                  style={{ color: COLORS.primaryDark }}
                >
                  Xem tất cả {photoItems.length} ảnh
                </Text>
              </Pressable>
            </View>
          )}

          {/* ============================================
              TAB ĐỀ CẬP
          ============================================ */}

          {activeTab === 'mentions' && (
            <View>
              <Text
                className="text-[20px] font-extrabold"
                style={{ color: COLORS.text }}
              >
                Thông tin liên quan
              </Text>

              <View className="mt-4 rounded-2xl bg-[#F8F8FF] p-4">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="text-box-outline"
                    size={22}
                    color={COLORS.primary}
                  />

                  <Text
                    className="ml-2 flex-1 text-[15px] font-bold"
                    style={{ color: COLORS.text }}
                  >
                    {place.name}
                  </Text>
                </View>

                <Text className="mt-3 text-[13px] leading-6 text-[#53687A]">
                  {place.description}
                </Text>
              </View>

              <Text
                className="mb-3 mt-5 text-[15px] font-bold"
                style={{ color: COLORS.text }}
              >
                Điểm nổi bật được giới thiệu
              </Text>

              {place.highlights.map((item, index) => (
                <View
                  key={`${item.name}-${index}`}
                  className="mb-3 flex-row items-center rounded-2xl border border-[#ECEEF6] bg-white p-2"
                >
                  <Image
                    source={{ uri: item.image }}
                    style={{
                      width: 72,
                      height: 66,
                      borderRadius: 11,
                    }}
                  />

                  <Text
                    className="ml-3 flex-1 text-[13px] font-semibold"
                    style={{ color: COLORS.text }}
                  >
                    {item.name}
                  </Text>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={21}
                    color="#8CA0B1"
                  />
                </View>
              ))}

              <Text className="mt-2 text-[11px] leading-5 text-[#8998A8]">
                Nội dung từ dữ liệu giới thiệu hiện có,
                chưa phải bài viết hay lượt đề cập từ bên thứ ba.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ==================== FIXED FOOTER ==================== */}

      <View className="border-t border-[#EDF0F5] bg-white px-4 pb-2 pt-2.5">

        {/* VIEW PLAN */}

        <Pressable
          onPress={() =>
            setShowSelectedPlaces(true)
          }
          className="mb-2.5 h-12 flex-row items-center justify-center rounded-full border border-[#B8EAE3] bg-[#F0FCF9]"
        >
          <MaterialCommunityIcons
            name="clipboard-list-outline"
            size={20}
            color={COLORS.primaryDark}
          />

          <Text
            className="ml-2 text-[14px] font-bold"
            style={{ color: COLORS.primaryDark }}
          >
            Xem kế hoạch của tôi
            {typeof planCount === 'number'
              ? ` (${planCount})`
              : ''}
          </Text>

          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={COLORS.primaryDark}
            style={{ marginLeft: 6 }}
          />
        </Pressable>

        {/* ADD TO PLAN */}

        <Pressable
          onPress={onTogglePlan}
          className="h-12 flex-row items-center justify-center rounded-full active:opacity-80"
          style={{
            backgroundColor: inPlan
              ? COLORS.mint
              : COLORS.primaryDark,
          }}
        >
          <MaterialCommunityIcons
            name={
              inPlan
                ? 'check-circle'
                : 'map-marker-plus-outline'
            }
            size={19}
            color={
              inPlan
                ? COLORS.primaryDark
                : 'white'
            }
          />

          <Text
            className="ml-2 text-[14px] font-bold"
            style={{
              color: inPlan
                ? COLORS.primaryDark
                : 'white',
            }}
          >
            {inPlan
              ? 'Đã thêm vào kế hoạch'
              : 'Thêm vào kế hoạch'}
          </Text>
        </Pressable>
      </View>

      {/* ==================== PHOTO VIEWER MODAL ==================== */}

      <Modal
        visible={photoViewer !== null}
        animationType="slide"
        onRequestClose={closePhotoViewer}
      >
        <SafeAreaView
          edges={['top', 'bottom']}
          className="flex-1"
          style={{
            backgroundColor:
              photoViewer?.mode === 'preview'
                ? '#101419'
                : COLORS.white,
          }}
        >
          <StatusBar
            barStyle={
              photoViewer?.mode === 'preview'
                ? 'light-content'
                : 'dark-content'
            }
          />

          {/* MODAL HEADER */}

          <View
            className="h-[58px] flex-row items-center justify-between px-4"
            style={{
              borderBottomWidth:
                photoViewer?.mode === 'gallery' ? 1 : 0,
              borderBottomColor: '#EEF0F5',
            }}
          >
            <Pressable
              onPress={closePhotoViewer}
              className="h-10 w-10 items-center justify-center"
            >
              <MaterialCommunityIcons
                name={
                  photoViewer?.mode === 'gallery'
                    ? 'close'
                    : 'arrow-left'
                }
                size={25}
                color={
                  photoViewer?.mode === 'preview'
                    ? 'white'
                    : COLORS.text
                }
              />
            </Pressable>

            <Text
              className="text-[16px] font-bold"
              style={{
                color:
                  photoViewer?.mode === 'preview'
                    ? 'white'
                    : COLORS.text,
              }}
            >
              {photoViewer?.mode === 'gallery'
                ? `Tất cả ảnh (${photoItems.length})`
                : place.name}
            </Text>

            <View style={{ width: 40 }} />
          </View>

          {/* ALL PHOTOS GRID */}

          {photoViewer?.mode === 'gallery' ? (
            <ScrollView
              className="flex-1"
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingTop: 14,
                paddingBottom: 24,
              }}
            >
              <View className="flex-row flex-wrap justify-between">
                {photoItems.map(item => (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      openPhoto(item.uri, true)
                    }
                    style={{
                      width: '48.5%',
                      marginBottom: 14,
                    }}
                  >
                    <Image
                      source={{ uri: item.uri }}
                      resizeMode="cover"
                      style={{
                        width: '100%',
                        height: 150,
                        borderRadius: 12,
                      }}
                    />

                    <Text
                      numberOfLines={1}
                      className="mt-1.5 text-[11px]"
                      style={{ color: COLORS.text }}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          ) : photoViewer?.mode === 'preview' ? (
            /* FULLSCREEN PHOTO */

            <View className="flex-1 items-center justify-center">
              <Image
                source={{ uri: photoViewer.uri }}
                style={{
                  width: '100%',
                  height: '82%',
                }}
                resizeMode="contain"
              />
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
