import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { errorMessage } from '../../api/http';
import { referenceApi } from '../../api/referenceApi';
import {
  toAiTripPlace,
  tripFlowApi,
  type AiRecommendationResponse,
  type PartnerPlace,
  type TravelPlanResponse,
  type TripPlace,
} from '../../api/tripFlowApi';
import PlacesMap, { hasCoordinate, type PlacesMapHandle } from '../../components/PlacesMap';
import type { RootScreenProps } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { Chip, Cover, FlowProgress, remoteImageSource } from '../../ui/Bits';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Header, Screen } from '../../ui/Screen';
import { EmptyState, ErrorState, Loading, Notice } from '../../ui/States';
import { countDays, formatMoney } from '../../utils/format';

/** Màu huy hiệu độ phù hợp: ≥75 rất phù hợp, ≥55 phù hợp, còn lại có thể bạn thích */
export const matchColor = (percent: number) =>
  percent >= 75 ? '#087A78' : percent >= 55 ? '#2E8B57' : '#6B7C89';

const priceLabel = (place: TripPlace) =>
  place.estimatedCost === null
    ? 'Chưa có giá tham khảo'
    : place.estimatedCost === 0
      ? 'Miễn phí'
      : formatMoney(place.estimatedCost, place.currency ?? 'VND');

function SuggestionCard({
  place,
  selected,
  busy,
  onOpen,
  onToggle,
}: {
  place: TripPlace;
  selected: boolean;
  busy: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const hasWhy = (place.aiReasons?.length ?? 0) > 0 || (place.aiCautions?.length ?? 0) > 0;
  return (
    <View
      style={shadow.card}
      className="overflow-hidden rounded-[20px] border border-[#E7EBEF] bg-white"
    >
      <Pressable onPress={onOpen}>
        {/* Bọc ảnh + badge trong khung relative riêng để badge loại hình nằm trên ảnh, không đè lên giá */}
        <View className="relative">
          <Cover uri={place.imageUrl} height={150} />
          <View className="absolute bottom-2 left-2 max-w-[70%] rounded-full bg-white/95 px-2.5 py-1">
            <Text numberOfLines={1} className="text-[10.5px] font-bold text-[#075C66]">
              {place.categoryName ?? 'Địa điểm du lịch'}
            </Text>
          </View>
          {place.aiMatchPercent !== undefined ? (
            <View
              style={{ backgroundColor: matchColor(place.aiMatchPercent) }}
              className="absolute right-2 top-2 flex-row items-center gap-1 rounded-full px-2.5 py-1"
            >
              <Icon name="auto-awesome" size={13} color="#FFFFFF" />
              <Text className="text-[11px] font-extrabold text-white">
                {place.aiMatchPercent}% phù hợp
              </Text>
            </View>
          ) : null}
        </View>
        <View className="px-3.5 pb-2 pt-3">
          <Text numberOfLines={2} className="text-[14.5px] font-extrabold leading-5 text-[#13364A]">
            {place.name}
          </Text>
          <View className="mt-1 flex-row items-start gap-1">
            <Icon name="location-on" size={15} color="#72818C" />
            <Text numberOfLines={2} className="flex-1 text-[11.5px] text-[#72818C]">
              {place.address || place.province || 'Chưa có địa chỉ'}
            </Text>
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-[12.5px] font-extrabold text-[#087A78]">{priceLabel(place)}</Text>
            <Text className="text-[10.5px] text-[#8C9AA3]">
              {place.aiRank !== undefined
                ? `${place.aiMatchLabel ?? 'Gợi ý'} · Xếp hạng #${place.aiRank}`
                : 'Địa điểm đã chọn'}
            </Text>
          </View>
        </View>
      </Pressable>

      {hasWhy ? (
        <View className="px-3.5">
          <Pressable
            onPress={() => setShowWhy((open) => !open)}
            className="flex-row items-center justify-between rounded-lg bg-[#F1FAF8] px-2.5 py-2"
          >
            <View className="flex-row items-center gap-1">
              <Icon name="lightbulb" size={15} color="#075C66" />
              <Text className="text-[11.5px] font-bold text-[#075C66]">Vì sao gợi ý?</Text>
            </View>
            <Icon name={showWhy ? 'expand-less' : 'expand-more'} size={18} color="#075C66" />
          </Pressable>
          {showWhy ? (
            <View className="mt-2 gap-1.5">
              {place.aiReasons?.map((reason) => (
                <View key={reason} className="flex-row items-start gap-1.5">
                  <Icon name="check-circle" size={14} color="#087A78" style={{ marginTop: 2 }} />
                  <Text className="flex-1 text-[12px] leading-[18px] text-[#13364A]">{reason}</Text>
                </View>
              ))}
              {place.aiCautions?.map((caution) => (
                <View key={caution} className="flex-row items-start gap-1.5">
                  <Icon name="warning" size={14} color="#D97706" style={{ marginTop: 2 }} />
                  <Text className="flex-1 text-[12px] leading-[18px] text-[#92400E]">
                    {caution}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View className="px-3.5 pb-3.5 pt-2.5">
        <Pressable
          onPress={onToggle}
          disabled={busy}
          style={{ backgroundColor: selected ? '#DAF5EA' : '#075C66', opacity: busy ? 0.6 : 1 }}
          className="h-10 flex-row items-center justify-center gap-1.5 rounded-xl"
        >
          <Icon
            name={selected ? 'check-circle' : 'add'}
            size={18}
            color={selected ? '#075C66' : '#FFFFFF'}
          />
          <Text
            style={{ color: selected ? '#075C66' : '#FFFFFF' }}
            className="text-[12px] font-extrabold"
          >
            {selected ? 'Đã chọn · Bỏ chọn' : 'Thêm vào kế hoạch'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Thẻ gọn của khu "Đối tác đã xác minh" (không chấm % phù hợp) */
function PartnerCard({
  place,
  selected,
  busy,
  onOpen,
  onToggle,
}: {
  place: PartnerPlace;
  selected: boolean;
  busy: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  return (
    <View
      style={shadow.card}
      className="w-[270px] rounded-2xl border border-[#E7EBEF] bg-white p-2.5"
    >
      <Pressable onPress={onOpen} className="flex-row gap-2.5">
        <View className="h-[72px] w-[72px] overflow-hidden rounded-xl bg-[#DCEFEB]">
          {place.coverUrl ? (
            <Image
              source={remoteImageSource(place.coverUrl)}
              style={{ width: '100%', height: '100%' }}
            />
          ) : null}
        </View>
        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={2}
            className="text-[13px] font-extrabold leading-[17px] text-[#13364A]"
          >
            {place.name}
          </Text>
          {place.verified ? (
            <View className="mt-1 flex-row items-center gap-1 self-start rounded-full bg-[#E8F1FF] px-2 py-0.5">
              <Icon name="verified" size={13} color={colors.verified} />
              <Text className="text-[10px] font-bold text-[#1F5FBF]">Đối tác đã xác minh</Text>
            </View>
          ) : null}
          <Text numberOfLines={1} className="mt-1 text-[11px] text-[#72818C]">
            {[place.categoryName, place.businessName].filter(Boolean).join(' · ')}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-1">
            <Icon name="star" size={13} color="#E0A100" />
            <Text className="text-[11px] text-[#72818C]">
              {place.rating !== null
                ? `${place.rating} (${place.reviewCount} đánh giá)`
                : 'Chưa có đánh giá'}
            </Text>
          </View>
        </View>
      </Pressable>
      <Pressable
        onPress={onToggle}
        disabled={busy}
        style={{ backgroundColor: selected ? '#DAF5EA' : '#075C66', opacity: busy ? 0.6 : 1 }}
        className="mt-2 h-9 flex-row items-center justify-center gap-1.5 rounded-xl"
      >
        <Icon
          name={selected ? 'check-circle' : 'add'}
          size={17}
          color={selected ? '#075C66' : '#FFFFFF'}
        />
        <Text
          style={{ color: selected ? '#075C66' : '#FFFFFF' }}
          className="text-[11.5px] font-extrabold"
        >
          {selected ? 'Đã chọn · Bỏ chọn' : 'Thêm vào kế hoạch'}
        </Text>
      </Pressable>
    </View>
  );
}

/** Gợi ý địa điểm cho chuyến đi (bước 3) — giống SuggestedPlacesPage của web */
export default function SuggestedPlacesScreen({
  navigation,
  route,
}: RootScreenProps<'Suggestions'>) {
  const { planId } = route.params;
  const mapRef = useRef<PlacesMapHandle>(null);
  const [plan, setPlan] = useState<TravelPlanResponse | null>(null);
  const [places, setPlaces] = useState<TripPlace[]>([]);
  const [aiSummary, setAiSummary] = useState<AiRecommendationResponse | null>(null);
  const [partners, setPartners] = useState<PartnerPlace[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [category, setCategory] = useState('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busyPlaceId, setBusyPlaceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const preloaded =
      retryCount === 0 && route.params.recommendation?.planId === planId
        ? route.params.recommendation
        : null;
    Promise.all([
      tripFlowApi.plan(planId),
      preloaded ? Promise.resolve(preloaded) : tripFlowApi.recommendedPlaces(planId),
      tripFlowApi.selectedPlaces(planId),
      referenceApi.categories().catch(() => []),
    ])
      .then(([savedPlan, recommended, selected, groups]) => {
        if (!active) return;
        const categoryNames = new Map(
          groups
            .flatMap((group) => [group, ...group.subtypes])
            .map((item) => [item.code, item.name] as const),
        );
        const aiPlaces = recommended.items.map((item) => ({
          ...toAiTripPlace(item, savedPlan.destination),
          categoryName: categoryNames.get(item.categoryCode ?? '') ?? item.categoryCode,
        }));
        const aiIds = new Set(aiPlaces.map((item) => item.placeId));
        // Giữ các địa điểm đã chọn trước đó để có thể bỏ chọn
        const alreadySelected = selected.places.filter((item) => !aiIds.has(item.placeId));
        setPlan(savedPlan);
        setAiSummary(recommended);
        setPlaces([...aiPlaces, ...alreadySelected]);
        setSelectedIds(new Set(selected.places.map((item) => item.placeId)));
      })
      .catch((caught: unknown) => active && setError(errorMessage(caught)))
      .finally(() => active && setLoading(false));
    // Khu đối tác: lỗi thì chỉ ẩn, không chặn danh sách gợi ý
    tripFlowApi
      .partnerPlaces(planId)
      .then((items) => active && setPartners(items))
      .catch(() => active && setPartners([]));
    return () => {
      active = false;
    };
  }, [planId, retryCount, route.params.recommendation]);

  // Quay lại từ màn chi tiết / đã chọn: đồng bộ lại danh sách đã chọn
  useEffect(
    () =>
      navigation.addListener('focus', () => {
        tripFlowApi
          .selectedPlaces(planId)
          .then((selected) => setSelectedIds(new Set(selected.places.map((item) => item.placeId))))
          .catch(() => undefined);
      }),
    [navigation, planId],
  );

  const categories = useMemo(() => {
    const grouped = new Map<string, { label: string; count: number }>();
    for (const place of places) {
      const key = place.categoryCode ?? 'uncategorized';
      grouped.set(key, {
        label: place.categoryName ?? 'Khác',
        count: (grouped.get(key)?.count ?? 0) + 1,
      });
    }
    return [
      { id: 'all', label: 'Tất cả', count: places.length },
      ...Array.from(grouped, ([id, value]) => ({ id, ...value })),
    ];
  }, [places]);

  const visiblePlaces = useMemo(
    () =>
      category === 'all'
        ? places
        : places.filter((place) => (place.categoryCode ?? 'uncategorized') === category),
    [places, category],
  );

  const mapPoints = useMemo(
    () =>
      visiblePlaces
        .filter(hasCoordinate)
        .slice(0, 30)
        .map((place, index) => ({
          id: String(place.placeId),
          latitude: place.latitude,
          longitude: place.longitude,
          label: String(place.aiRank ?? index + 1),
          title: place.name,
        })),
    [visiblePlaces],
  );

  const togglePlace = async (placeId: number) => {
    if (busyPlaceId !== null) return;
    const wasSelected = selectedIds.has(placeId);
    setBusyPlaceId(placeId);
    setActionError(null);
    try {
      if (wasSelected) await tripFlowApi.removePlace(planId, placeId);
      else await tripFlowApi.addPlace(planId, placeId);
      setSelectedIds((current) => {
        const next = new Set(current);
        if (wasSelected) next.delete(placeId);
        else next.add(placeId);
        return next;
      });
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setBusyPlaceId(null);
    }
  };

  const openDetail = (placeId: number) =>
    navigation.navigate('SuggestionDetail', { planId, placeId });

  const header = (
    <View className="bg-white">
      <Header
        title="Địa điểm cho chuyến đi"
        subtitle={
          plan
            ? `${plan.destination} • ${countDays(plan.startDate, plan.endDate)} ngày • ${plan.groupSize} người`
            : undefined
        }
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            onPress={() => navigation.navigate('SelectedPlaces', { planId })}
            className="flex-row items-center gap-1 rounded-full bg-[#ECFEFF] px-3 py-2"
          >
            <Icon name="shopping-basket" size={17} color={colors.primaryStrong} />
            <Text className="text-[12px] font-bold text-[#0E7490]">({selectedIds.size})</Text>
          </Pressable>
        }
      />
      <FlowProgress current={3} />
    </View>
  );

  if (loading) {
    return (
      <Screen header={header}>
        <Loading label="Đang tải kế hoạch và các địa điểm…" />
      </Screen>
    );
  }
  if (error || !plan) {
    return (
      <Screen header={header}>
        <ErrorState
          message={error ?? 'Không tải được kế hoạch.'}
          onRetry={() => setRetryCount((n) => n + 1)}
        />
      </Screen>
    );
  }

  const listHeader = (
    <View>
      <View className="mb-3 rounded-2xl border border-[#DDEDE7] bg-[#F4FBF8] p-3">
        <View className="flex-row items-center gap-1.5">
          <Icon name="travel-explore" size={18} color="#075C66" />
          <Text className="text-[13.5px] font-extrabold text-[#13364A]">
            Địa điểm gợi ý cho chuyến đi
          </Text>
        </View>
        <Text className="mt-1 text-[11.5px] leading-5 text-[#72818C]">
          {aiSummary?.degraded
            ? 'SmartTravel tạm thời không khả dụng; hệ thống dùng loại hình và ngân sách để xếp hạng.'
            : 'Địa điểm được xếp hạng theo mức độ phù hợp với sở thích, loại hình và ngân sách của bạn.'}{' '}
          Bạn có thể thêm hoặc bỏ địa điểm.
        </Text>
        {aiSummary ? (
          <Text className="mt-1 text-[11.5px] font-semibold text-[#557080]">
            Cần khoảng {aiSummary.needed} điểm · Có {aiSummary.available} ứng viên · SmartTravel gợi
            ý {aiSummary.items.length} địa điểm
          </Text>
        ) : null}
      </View>

      {aiSummary && aiSummary.warnings.length > 0 ? (
        <Notice tone="warning">{aiSummary.warnings.join('\n')}</Notice>
      ) : null}
      {actionError ? <Notice tone="danger">{actionError}</Notice> : null}

      {/* Bản đồ */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[13px] font-bold text-[#557080]">
          {mapPoints.length} địa điểm có tọa độ
        </Text>
        <Pressable onPress={() => setShowMap((v) => !v)} className="flex-row items-center gap-1">
          <Icon name={showMap ? 'map' : 'map'} size={16} color={colors.primary} />
          <Text className="text-[12.5px] font-bold text-[#0891B2]">
            {showMap ? 'Ẩn bản đồ' : 'Xem bản đồ'}
          </Text>
        </Pressable>
      </View>
      {showMap && mapPoints.length > 0 ? (
        <View style={{ height: 220, borderRadius: 20, overflow: 'hidden', marginBottom: 14 }}>
          <PlacesMap ref={mapRef} points={mapPoints} activeId={activeId} onSelect={setActiveId} />
        </View>
      ) : null}

      {/* Đối tác đã xác minh: luôn hiện các đối tác của tỉnh đến, không phụ thuộc % phù hợp */}
      {partners.length > 0 ? (
        <View className="mb-4 rounded-[20px] border border-[#DCE7F7] bg-[#F7FAFF] p-3">
          <View className="flex-row items-center gap-1.5">
            <Icon name="verified" size={18} color={colors.verified} />
            <Text className="flex-1 text-[13.5px] font-extrabold text-[#13364A]">
              Đối tác tại {plan.destination}
            </Text>
            <View className="rounded-full bg-white px-2 py-0.5">
              <Text className="text-[10.5px] font-bold text-[#1F5FBF]">{partners.length}</Text>
            </View>
          </View>
          <Text className="mb-3 mt-1 text-[11px] leading-4 text-[#72818C]">
            Địa điểm do doanh nghiệp đã được xác minh đăng ký. Không tính vào % phù hợp.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingBottom: 2 }}
          >
            {partners.map((partner) => (
              <PartnerCard
                key={partner.placeId}
                place={partner}
                selected={selectedIds.has(partner.placeId)}
                busy={busyPlaceId !== null}
                onOpen={() => openDetail(partner.placeId)}
                onToggle={() => void togglePlace(partner.placeId)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
      >
        {categories.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            count={item.count}
            selected={item.id === category}
            onPress={() => setCategory(item.id)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Screen
      header={header}
      scroll={false}
      footer={
        <View className="border-t border-[#EEF1F5] bg-white px-4 pb-4 pt-3">
          <Button
            title={
              selectedIds.size > 0
                ? `Xem ${selectedIds.size} địa điểm đã chọn`
                : 'Chọn địa điểm để tiếp tục'
            }
            icon="shopping-basket"
            iconRight="arrow-forward"
            disabled={selectedIds.size === 0 || busyPlaceId !== null}
            onPress={() => navigation.navigate('SelectedPlaces', { planId })}
          />
        </View>
      }
    >
      <FlatList
        data={visiblePlaces}
        keyExtractor={(item) => String(item.placeId)}
        contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 14 }}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <SuggestionCard
            place={item}
            selected={selectedIds.has(item.placeId)}
            busy={busyPlaceId !== null}
            onOpen={() => {
              setActiveId(String(item.placeId));
              openDetail(item.placeId);
            }}
            onToggle={() => void togglePlace(item.placeId)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Chưa có địa điểm phù hợp"
            message="SmartTravel chưa tìm thấy địa điểm khớp điểm đến và danh mục đã chọn. Bạn vẫn có thể mở danh sách địa điểm đã chọn ở nút bên trên."
          />
        }
      />
    </Screen>
  );
}
