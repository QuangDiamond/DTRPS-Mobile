import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, type LatLng } from 'react-native-maps';

import {
  tripFlowApi,
  type AiRecommendationResponse,
  type AiRecommendedPlace,
  type PartnerPlace,
  type TravelPlanResponse,
} from '../../services/tripFlowApi';
import { errorMessage } from '../../services/httpClient';

// ==================== TYPES ====================

type SuggestedPlacesScreenProps = {
  planId: number;
  /** Đã có sẵn từ GeneratingTripScreen (vừa gọi recommendedPlaces) — tránh gọi lại API. */
  initialRecommendation?: AiRecommendationResponse;
  onBack: () => void;
  onSavePlan: (selectedCount: number) => void;
};

// ==================== COLORS ====================

const COLORS = {
  primary: '#087A78',
  primaryDark: '#075C66',
  text: '#13364A',
  muted: '#72818C',
  lightPurple: '#EBEDFF',
  mint: '#C3F8F0',
  white: '#FFFFFF',
  border: '#E7EBEF',
  amber: '#92400E',
  amberBg: '#FFFBEB',
};

const FLOW_STEPS = 6;
const CURRENT_FLOW_STEP = 3;

const hasCoordinate = (
  place: AiRecommendedPlace,
): place is AiRecommendedPlace & { latitude: number; longitude: number } =>
  typeof place.latitude === 'number' &&
  Number.isFinite(place.latitude) &&
  typeof place.longitude === 'number' &&
  Number.isFinite(place.longitude);

const matchColor = (percent: number) =>
  percent >= 75 ? COLORS.primary : percent >= 55 ? '#2E8B57' : '#6B7C89';

function priceLabel(place: AiRecommendedPlace): string {
  if (place.referencePrice === null) return 'Chưa có giá tham khảo';
  if (place.referencePrice === 0) return 'Miễn phí';
  return `${new Intl.NumberFormat('vi-VN').format(place.referencePrice)} đ`;
}

// ==================== PLACE CARD ====================

function RecommendedCard({
  place,
  selected,
  busy,
  onToggle,
}: {
  place: AiRecommendedPlace;
  selected: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const hasWhy = place.reasons.length > 0 || place.cautions.length > 0;

  return (
    <View
      style={{
        width: '48.5%',
        borderRadius: 18,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        elevation: 2,
      }}
    >
      <View style={{ height: 118, backgroundColor: '#DCEFEB' }}>
        {place.imageUrl ? (
          <Image source={{ uri: place.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <MaterialCommunityIcons name="image-outline" size={34} color="#73B8AD" />
          </View>
        )}
        <View
          className="absolute right-1.5 top-1.5 flex-row items-center rounded-full px-2 py-1"
          style={{ backgroundColor: matchColor(place.matchPercent) }}
        >
          <MaterialCommunityIcons name="star-four-points" size={11} color="white" />
          <Text className="ml-1 text-[10px] font-extrabold text-white">{place.matchPercent}%</Text>
        </View>
      </View>

      <View className="px-2.5 pb-2 pt-2">
        <Text numberOfLines={2} className="text-[12.5px] font-extrabold" style={{ color: COLORS.text, minHeight: 32 }}>
          {place.name}
        </Text>
        <View className="mt-1 flex-row items-start">
          <MaterialCommunityIcons name="map-marker-outline" size={13} color={COLORS.muted} />
          <Text numberOfLines={2} className="ml-1 flex-1 text-[10.5px]" style={{ color: COLORS.muted }}>
            {place.address ?? 'Chưa có địa chỉ'}
          </Text>
        </View>
        <Text className="mt-1 text-[11px] font-extrabold" style={{ color: COLORS.primary }}>
          {priceLabel(place)}
        </Text>
        <Text className="mt-0.5 text-[9.5px]" style={{ color: COLORS.muted }}>
          {place.matchLabel} · Xếp hạng #{place.rank}
        </Text>

        {hasWhy && (
          <Pressable
            onPress={() => setShowWhy((value) => !value)}
            className="mt-1.5 flex-row items-center justify-between rounded-lg px-2 py-1.5"
            style={{ backgroundColor: '#F1FAF8' }}
          >
            <Text className="text-[10px] font-bold" style={{ color: COLORS.primaryDark }}>
              Vì sao gợi ý?
            </Text>
            <MaterialCommunityIcons
              name={showWhy ? 'chevron-up' : 'chevron-down'}
              size={15}
              color={COLORS.primaryDark}
            />
          </Pressable>
        )}
        {showWhy && (
          <View className="mt-1.5">
            {place.reasons.map((reason) => (
              <View key={reason} className="mb-1 flex-row items-start">
                <MaterialCommunityIcons name="check-circle" size={12} color={COLORS.primary} />
                <Text className="ml-1 flex-1 text-[10px]" style={{ color: COLORS.text }}>
                  {reason}
                </Text>
              </View>
            ))}
            {place.cautions.map((caution) => (
              <View key={caution} className="mb-1 flex-row items-start">
                <MaterialCommunityIcons name="alert-outline" size={12} color="#B45309" />
                <Text className="ml-1 flex-1 text-[10px]" style={{ color: '#92400E' }}>
                  {caution}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={onToggle}
          disabled={busy}
          className="mt-2 h-9 flex-row items-center justify-center rounded-xl"
          style={{ backgroundColor: selected ? '#DAF5EA' : COLORS.primaryDark, opacity: busy ? 0.6 : 1 }}
        >
          <MaterialCommunityIcons
            name={busy ? 'progress-clock' : selected ? 'check-circle-outline' : 'plus'}
            size={16}
            color={selected ? COLORS.primaryDark : 'white'}
          />
          <Text
            numberOfLines={1}
            className="ml-1 text-[10.5px] font-extrabold"
            style={{ color: selected ? COLORS.primaryDark : 'white' }}
          >
            {busy ? 'Đang cập nhật...' : selected ? 'Đã thêm' : 'Thêm vào kế hoạch'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ==================== PARTNER CARD ====================

function PartnerCard({
  place,
  selected,
  busy,
  onToggle,
}: {
  place: PartnerPlace;
  selected: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <View
      className="flex-row rounded-2xl p-2.5"
      style={{ borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white }}
    >
      <View className="h-16 w-16 overflow-hidden rounded-xl bg-[#DCEFEB]">
        {place.coverUrl ? (
          <Image source={{ uri: place.coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <MaterialCommunityIcons name="storefront-outline" size={24} color="#73B8AD" />
          </View>
        )}
      </View>
      <View className="ml-2.5 min-w-0 flex-1">
        <Text numberOfLines={2} className="text-[12.5px] font-extrabold" style={{ color: COLORS.text }}>
          {place.name}
        </Text>
        {place.verified && (
          <View className="mt-0.5 flex-row items-center self-start rounded-full bg-[#E8F1FF] px-1.5 py-0.5">
            <MaterialCommunityIcons name="check-decagram" size={11} color="#1F5FBF" />
            <Text className="ml-0.5 text-[9px] font-bold" style={{ color: '#1F5FBF' }}>
              Đối tác đã xác minh
            </Text>
          </View>
        )}
        <Text numberOfLines={1} className="mt-0.5 text-[10.5px]" style={{ color: COLORS.muted }}>
          {[place.categoryName, place.businessName].filter(Boolean).join(' · ')}
        </Text>
        <View className="mt-0.5 flex-row items-center">
          <MaterialCommunityIcons name="star" size={12} color="#E0A100" />
          <Text className="ml-1 text-[10.5px]" style={{ color: COLORS.muted }}>
            {place.rating !== null ? `${place.rating} (${place.reviewCount})` : 'Chưa có đánh giá'}
          </Text>
        </View>
        <Pressable
          onPress={onToggle}
          disabled={busy}
          className="mt-1.5 h-7 flex-row items-center justify-center self-start rounded-lg px-2.5"
          style={{ backgroundColor: selected ? '#DAF5EA' : COLORS.primaryDark, opacity: busy ? 0.6 : 1 }}
        >
          <MaterialCommunityIcons
            name={selected ? 'check-circle-outline' : 'plus'}
            size={13}
            color={selected ? COLORS.primaryDark : 'white'}
          />
          <Text
            className="ml-1 text-[10px] font-extrabold"
            style={{ color: selected ? COLORS.primaryDark : 'white' }}
          >
            {selected ? 'Đã thêm' : 'Thêm'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ==================== MAIN SCREEN ====================

/**
 * Gợi ý AI thật từ Backend (RecommendationController.recommend, GET
 * /travel-plans/{planId}/recommended-places) — không tự tính % phù hợp hay tự sinh lý do;
 * mọi giá trị hiển thị (matchPercent, matchLabel, reasons, cautions) lấy nguyên văn từ API.
 */
export default function SuggestedPlacesScreen({
  planId,
  initialRecommendation,
  onBack,
  onSavePlan,
}: SuggestedPlacesScreenProps) {
  const mapRef = useRef<MapView>(null);

  const [plan, setPlan] = useState<TravelPlanResponse | null>(null);
  const [recommendation, setRecommendation] = useState<AiRecommendationResponse | null>(
    initialRecommendation ?? null,
  );
  const [partners, setPartners] = useState<PartnerPlace[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [category, setCategory] = useState('all');
  const [busyPlaceId, setBusyPlaceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(!initialRecommendation);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const [savedPlan, recommended, selected] = await Promise.all([
          tripFlowApi.plan(planId),
          retryCount === 0 && initialRecommendation
            ? Promise.resolve(initialRecommendation)
            : tripFlowApi.recommendedPlaces(planId),
          tripFlowApi.selectedPlaces(planId),
        ]);
        if (!active) return;
        setPlan(savedPlan);
        setRecommendation(recommended);
        setSelectedIds(new Set(selected.places.map((item) => item.placeId)));
      } catch (caught) {
        if (active) setError(errorMessage(caught));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [planId, retryCount]);

  // Cột đối tác tải riêng, lỗi thì chỉ ẩn cột — không chặn danh sách gợi ý AI.
  useEffect(() => {
    let active = true;
    tripFlowApi
      .partnerPlaces(planId)
      .then((items) => {
        if (active) setPartners(items);
      })
      .catch(() => {
        if (active) setPartners([]);
      });
    return () => {
      active = false;
    };
  }, [planId, retryCount]);

  const items = recommendation?.items ?? [];

  const categories = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const item of items) {
      const key = item.categoryCode ?? 'uncategorized';
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }
    return [
      { id: 'all', label: 'Tất cả', count: items.length },
      ...Array.from(grouped, ([id, count]) => ({ id, label: id, count })),
    ];
  }, [items]);

  const visibleItems = useMemo(
    () => (category === 'all' ? items : items.filter((item) => (item.categoryCode ?? 'uncategorized') === category)),
    [items, category],
  );

  const mapPoints = useMemo(
    () =>
      visibleItems.filter(hasCoordinate).map((item) => ({
        id: item.placeId,
        coordinate: { latitude: item.latitude, longitude: item.longitude } as LatLng,
        title: item.name,
      })),
    [visibleItems],
  );

  useEffect(() => {
    if (mapPoints.length === 0) return;
    if (mapPoints.length === 1) {
      mapRef.current?.animateToRegion(
        { ...mapPoints[0].coordinate, latitudeDelta: 0.05, longitudeDelta: 0.05 },
        400,
      );
      return;
    }
    mapRef.current?.fitToCoordinates(
      mapPoints.map((point) => point.coordinate),
      { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: true },
    );
  }, [mapPoints]);

  const togglePlace = async (placeId: number) => {
    if (busyPlaceId !== null) return;
    const wasSelected = selectedIds.has(placeId);
    setBusyPlaceId(placeId);
    try {
      if (wasSelected) {
        await tripFlowApi.removePlace(planId, placeId);
      } else {
        await tripFlowApi.addPlace(planId, placeId);
      }
      setSelectedIds((current) => {
        const next = new Set(current);
        if (wasSelected) next.delete(placeId);
        else next.add(placeId);
        return next;
      });
    } catch {
      // Giữ trạng thái cũ nếu Backend từ chối (ví dụ kế hoạch không còn ở trạng thái sửa được).
    } finally {
      setBusyPlaceId(null);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: COLORS.white }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* HEADER */}
      <View className="h-[54px] flex-row items-center px-3">
        <Pressable onPress={onBack} hitSlop={8} className="h-9 w-9 items-center justify-center">
          <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.text} />
        </Pressable>
        <Text className="ml-1 text-[17px] font-bold" style={{ color: COLORS.text }}>
          Địa điểm gợi ý cho bạn
        </Text>
      </View>

      <View className="flex-row gap-1.5 px-5 pb-2">
        {Array.from({ length: FLOW_STEPS }, (_, index) => (
          <View
            key={index}
            className="h-[5px] flex-1 rounded-full"
            style={{ backgroundColor: index < CURRENT_FLOW_STEP ? COLORS.primaryDark : '#E3E8EF' }}
          />
        ))}
      </View>

      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={COLORS.primary} />
          <Text className="mt-2 text-[12px]" style={{ color: COLORS.muted }}>
            Đang tải gợi ý từ SmartTravel...
          </Text>
        </View>
      )}

      {!loading && error && (
        <View className="flex-1 items-center justify-center px-6">
          <MaterialCommunityIcons name="cloud-alert" size={32} color="#D14343" />
          <Text className="mt-2 text-center text-[13px]" style={{ color: '#B91C1C' }}>
            {error}
          </Text>
          <Pressable
            onPress={() => setRetryCount((value) => value + 1)}
            className="mt-3 rounded-full px-4 py-2"
            style={{ backgroundColor: COLORS.primaryDark }}
          >
            <Text className="text-[12px] font-bold text-white">Thử lại</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
          {/* BẢN ĐỒ */}
          <View style={{ height: 200, backgroundColor: '#E0EEE9' }}>
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: mapPoints[0]?.coordinate.latitude ?? 16.0471,
                longitude: mapPoints[0]?.coordinate.longitude ?? 108.2062,
                latitudeDelta: 0.15,
                longitudeDelta: 0.15,
              }}
            >
              {mapPoints.map((point, index) => (
                <Marker key={point.id} coordinate={point.coordinate} title={point.title}>
                  <View
                    className="h-8 w-8 items-center justify-center rounded-full border-[2.5px] border-white"
                    style={{ backgroundColor: COLORS.primaryDark }}
                  >
                    <Text className="text-[12px] font-extrabold text-white">{index + 1}</Text>
                  </View>
                </Marker>
              ))}
            </MapView>
            <View className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5" style={{ elevation: 3 }}>
              <Text className="text-[11px] font-bold" style={{ color: COLORS.primaryDark }}>
                {mapPoints.length} địa điểm trên bản đồ
              </Text>
            </View>
          </View>

          {/* THÔNG TIN NGUỒN */}
          <View className="mx-3.5 mt-3 rounded-2xl p-3" style={{ backgroundColor: '#F4FBF8', borderWidth: 1, borderColor: '#DDEDE7' }}>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="compass-outline" size={17} color={COLORS.primaryDark} />
              <Text className="ml-1.5 text-[13px] font-extrabold" style={{ color: COLORS.text }}>
                Địa điểm gợi ý cho chuyến đi
              </Text>
            </View>
            <Text className="mt-1 text-[11px] leading-[16px]" style={{ color: COLORS.muted }}>
              {recommendation?.degraded
                ? 'SmartTravel tạm thời không khả dụng; hệ thống dùng loại hình và ngân sách để xếp hạng.'
                : 'Địa điểm được xếp hạng theo sở thích, ngân sách và mức độ phù hợp.'}
              {'  '}Bạn có thể thêm hoặc bỏ địa điểm.
            </Text>
            {recommendation && (
              <Text className="mt-1 text-[11px] font-semibold" style={{ color: COLORS.text }}>
                Cần khoảng {recommendation.needed} điểm · Có {recommendation.available} ứng viên · Gợi ý{' '}
                {recommendation.items.length} địa điểm
              </Text>
            )}
          </View>

          {recommendation && recommendation.warnings.length > 0 && (
            <View
              className="mx-3.5 mt-2.5 rounded-xl p-2.5"
              style={{ backgroundColor: COLORS.amberBg, borderWidth: 1, borderColor: '#FDE68A' }}
            >
              {recommendation.warnings.map((warning, index) => (
                <Text key={index} className="text-[11px]" style={{ color: COLORS.amber }}>
                  {warning}
                </Text>
              ))}
            </View>
          )}

          {/* LỌC DANH MỤC */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}
          >
            {categories.map((item) => {
              const selected = item.id === category;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setCategory(item.id)}
                  className="rounded-full px-3.5 py-2"
                  style={{ backgroundColor: selected ? COLORS.primaryDark : COLORS.lightPurple }}
                >
                  <Text className="text-[11.5px] font-semibold" style={{ color: selected ? 'white' : COLORS.text }}>
                    {item.label} ({item.count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* DANH SÁCH GỢI Ý */}
          <View className="mt-3 flex-row flex-wrap justify-between px-3.5" style={{ gap: 10 }}>
            {visibleItems.length === 0 ? (
              <View className="w-full items-center rounded-2xl bg-[#F8F8FF] px-4 py-10">
                <MaterialCommunityIcons name="map-search-outline" size={32} color="#94B5B6" />
                <Text className="mt-2 text-[12px]" style={{ color: COLORS.muted }}>
                  Chưa có địa điểm phù hợp trong danh mục này.
                </Text>
              </View>
            ) : (
              visibleItems.map((item) => (
                <RecommendedCard
                  key={item.placeId}
                  place={item}
                  selected={selectedIds.has(item.placeId)}
                  busy={busyPlaceId === item.placeId}
                  onToggle={() => void togglePlace(item.placeId)}
                />
              ))
            )}
          </View>

          {/* ĐỐI TÁC ĐÃ XÁC MINH */}
          {partners.length > 0 && plan && (
            <View className="mx-3.5 mt-5">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="check-decagram" size={17} color="#1F5FBF" />
                <Text className="ml-1.5 text-[13px] font-extrabold" style={{ color: COLORS.text }}>
                  Đối tác tại {plan.destination}
                </Text>
              </View>
              <Text className="mt-1 text-[10.5px] leading-4" style={{ color: COLORS.muted }}>
                Địa điểm do doanh nghiệp đã được xác minh đăng ký. Không tính vào % phù hợp.
              </Text>
              <View className="mt-2.5" style={{ gap: 8 }}>
                {partners.map((partner) => (
                  <PartnerCard
                    key={partner.placeId}
                    place={partner}
                    selected={selectedIds.has(partner.placeId)}
                    busy={busyPlaceId === partner.placeId}
                    onToggle={() => void togglePlace(partner.placeId)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* FOOTER */}
      {!loading && !error && (
        <View className="border-t px-4 pb-2 pt-2.5" style={{ borderColor: '#EEF1F5', backgroundColor: 'white' }}>
          <Pressable
            onPress={() => onSavePlan(selectedIds.size)}
            disabled={selectedIds.size === 0 || busyPlaceId !== null}
            className="h-12 flex-row items-center justify-center rounded-full active:opacity-80"
            style={{ backgroundColor: selectedIds.size > 0 ? COLORS.primaryDark : '#E3E8EF' }}
          >
            <MaterialCommunityIcons
              name="content-save-check-outline"
              size={19}
              color={selectedIds.size > 0 ? 'white' : COLORS.muted}
            />
            <Text
              className="ml-2 text-[14px] font-bold"
              style={{ color: selectedIds.size > 0 ? 'white' : COLORS.muted }}
            >
              {selectedIds.size > 0
                ? `Lưu kế hoạch (${selectedIds.size} địa điểm)`
                : 'Chọn địa điểm để thêm vào kế hoạch'}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
