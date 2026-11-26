import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { errorMessage } from '../../api/http';
import { tripFlowApi, type TravelPlanResponse, type TripPlace } from '../../api/tripFlowApi';
import type { RootScreenProps } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { Cover, FlowProgress } from '../../ui/Bits';
import { Button } from '../../ui/Button';
import { Icon, type IconName } from '../../ui/Icon';
import { Header, Screen } from '../../ui/Screen';
import { EmptyState, ErrorState, Notice } from '../../ui/States';
import { ListCardSkeleton } from '../../ui/Motion';
import { countDays, formatDate, formatMoney } from '../../utils/format';

const placeCost = (place: TripPlace) =>
  place.estimatedCost === null
    ? 'Chưa có giá tham khảo'
    : place.estimatedCost === 0
      ? 'Miễn phí'
      : formatMoney(place.estimatedCost, place.currency ?? 'VND');

function InfoChip({ icon, title }: { icon: IconName; title: string }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full bg-[#EEF5F7] px-3 py-2">
      <Icon name={icon} size={15} color="#506581" />
      <Text className="text-[11.5px] font-semibold text-[#506581]">{title}</Text>
    </View>
  );
}

/**
 * Bước 4–5: địa điểm đã chọn (plan_places) → Backend tự xếp lịch trình.
 * Giống SelectedPlacesPage của web.
 */
export default function SelectedPlacesScreen({
  navigation,
  route,
}: RootScreenProps<'SelectedPlaces'>) {
  const { planId } = route.params;
  const [plan, setPlan] = useState<TravelPlanResponse | null>(null);
  const [places, setPlaces] = useState<TripPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [deletingPlaceId, setDeletingPlaceId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(null);
      Promise.all([tripFlowApi.plan(planId), tripFlowApi.selectedPlaces(planId)])
        .then(([savedPlan, selected]) => {
          if (!active) return;
          setPlan(savedPlan);
          setPlaces(selected.places);
        })
        .catch((caught: unknown) => active && setError(errorMessage(caught)))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [planId, retryCount]),
  );

  const costSummary = useMemo(() => {
    const prices = places
      .filter((place) => place.estimatedCost !== null)
      .map((place) => place.estimatedCost as number);
    return {
      knownTotal: prices.reduce((sum, price) => sum + price, 0),
      unknownCount: places.length - prices.length,
    };
  }, [places]);

  const removePlace = (place: TripPlace) =>
    Alert.alert('Bỏ địa điểm đã chọn', `Bạn có chắc muốn bỏ “${place.name}” khỏi kế hoạch?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Bỏ địa điểm',
        style: 'destructive',
        onPress: async () => {
          setDeletingPlaceId(place.placeId);
          setActionError(null);
          try {
            await tripFlowApi.removePlace(planId, place.placeId);
            setPlaces((current) => current.filter((item) => item.placeId !== place.placeId));
          } catch (caught) {
            setActionError(errorMessage(caught));
          } finally {
            setDeletingPlaceId(null);
          }
        },
      },
    ]);

  const generateItinerary = async () => {
    if (!plan || generating || deletingPlaceId !== null) return;
    if (places.length === 0) {
      setActionError('Vui lòng chọn ít nhất một địa điểm để tạo lịch trình.');
      return;
    }
    setGenerating(true);
    setActionError(null);
    try {
      const generated = await tripFlowApi.generate(planId, {
        title: `Lịch trình ${plan.destination}`,
        notes: 'Lịch trình được tự động sắp xếp từ các địa điểm Traveller đã chọn.',
      });
      // Backend luôn tạo lịch trình; chỗ chưa hợp lý được trả về dạng cảnh báo, không chặn người dùng
      navigation.navigate('Itinerary', {
        planId: generated.planId,
        warnings: generated.warnings ?? [],
      });
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setGenerating(false);
    }
  };

  const header = (
    <View className="bg-white">
      <Header title="Kế hoạch của tôi" subtitle={plan?.title} onBack={() => navigation.goBack()} />
      <FlowProgress current={4} />
    </View>
  );

  if (loading && !plan) {
    return (
      <Screen header={header}>
        <ListCardSkeleton count={4} />
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

  return (
    <Screen
      header={header}
      footer={
        places.length > 0 ? (
          <View className="flex-row gap-2.5 border-t border-[#EEF1F5] bg-white px-4 pb-4 pt-3">
            <View className="flex-1">
              <Button
                title="Thêm địa điểm"
                icon="add"
                variant="outline"
                onPress={() => navigation.navigate('Suggestions', { planId })}
              />
            </View>
            <View className="flex-[1.4]">
              <Button
                title={generating ? 'Đang tạo lịch trình...' : 'Tự động tạo lịch trình'}
                icon="auto-awesome"
                loading={generating}
                disabled={deletingPlaceId !== null}
                onPress={() => void generateItinerary()}
              />
            </View>
          </View>
        ) : undefined
      }
    >
      <View style={shadow.card} className="mb-4 rounded-3xl bg-white p-4">
        <Text className="text-[18px] font-extrabold text-[#13364A]">{plan.destination}</Text>
        <Text className="mt-0.5 text-[12px] text-[#72818C]">
          {places.length} địa điểm đã thêm vào kế hoạch
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <InfoChip
            icon="calendar-month"
            title={`${formatDate(plan.startDate)} – ${formatDate(plan.endDate)}`}
          />
          <InfoChip icon="schedule" title={`${countDays(plan.startDate, plan.endDate)} ngày`} />
          <InfoChip icon="group" title={`${plan.groupSize} người`} />
        </View>
      </View>

      {actionError ? <Notice tone="danger">{actionError}</Notice> : null}

      {places.length === 0 ? (
        <EmptyState
          icon="shopping-basket"
          title="Chưa có địa điểm nào"
          message="Hãy chọn ít nhất một địa điểm trước khi tạo lịch trình."
          action={
            <Button
              title="Chọn địa điểm"
              icon="travel-explore"
              onPress={() => navigation.navigate('Suggestions', { planId })}
            />
          }
        />
      ) : (
        <>
          <Text className="mb-2.5 text-[15px] font-extrabold text-[#13364A]">Địa điểm đã chọn</Text>
          <View className="gap-3">
            {places.map((place, index) => (
              <View
                key={place.placeId}
                style={shadow.card}
                className="flex-row gap-3 rounded-2xl bg-white p-2.5"
              >
                <Pressable
                  onPress={() =>
                    navigation.navigate('SuggestionDetail', { planId, placeId: place.placeId })
                  }
                >
                  <Cover uri={place.imageUrl} height={86} radius={14} style={{ width: 86 }} />
                  <View className="absolute left-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-[#0891B2]">
                    <Text className="text-[11px] font-extrabold text-white">{index + 1}</Text>
                  </View>
                </Pressable>
                <View className="min-w-0 flex-1 py-0.5">
                  <View className="flex-row items-start gap-2">
                    <Text
                      numberOfLines={2}
                      className="flex-1 text-[14px] font-extrabold text-[#13364A]"
                    >
                      {place.name}
                    </Text>
                    <Pressable
                      onPress={() => removePlace(place)}
                      disabled={deletingPlaceId !== null}
                      hitSlop={8}
                      accessibilityLabel={`Bỏ ${place.name} khỏi kế hoạch`}
                    >
                      <Icon
                        name={
                          deletingPlaceId === place.placeId ? 'hourglass-empty' : 'delete-outline'
                        }
                        size={21}
                        color={colors.danger}
                      />
                    </Pressable>
                  </View>
                  <Text numberOfLines={1} className="mt-0.5 text-[11.5px] text-[#72818C]">
                    {place.address || 'Chưa cập nhật địa chỉ'}
                  </Text>
                  <View className="mt-1.5 flex-row items-center justify-between">
                    <Text
                      numberOfLines={1}
                      className="flex-1 text-[11px] font-semibold text-[#557080]"
                    >
                      {place.categoryName ?? place.categoryCode ?? ''}
                    </Text>
                    <Text className="text-[12px] font-extrabold text-[#087A78]">
                      {placeCost(place)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View className="mt-4 rounded-2xl bg-[#F4FBF8] p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[13px] font-bold text-[#13364A]">
                Cộng các giá tham khảo đã có
              </Text>
              <Text className="text-[16px] font-extrabold text-[#0E7490]">
                {formatMoney(costSummary.knownTotal)}
              </Text>
            </View>
            <Text className="mt-1 text-[11.5px] leading-[18px] text-[#72818C]">
              Chưa nhân theo số người, chưa tính di chuyển và các chi phí khác.
              {costSummary.unknownCount > 0
                ? ` Có ${costSummary.unknownCount} địa điểm chưa có giá.`
                : ''}{' '}
              Backend sẽ tính chi phí dự kiến khi tạo lịch trình.
            </Text>
          </View>

          <View className="mt-3 flex-row gap-2 rounded-2xl bg-[#ECFEFF] p-3.5">
            <Icon name="info-outline" size={18} color={colors.primaryStrong} />
            <Text className="flex-1 text-[11.5px] leading-[18px] text-[#0E7490]">
              Chỉ những địa điểm đã chọn mới được đưa vào lịch trình. Backend sẽ xếp theo ngày, giờ
              mở cửa, khoảng cách ước lượng và nhịp độ; không dùng AI để xếp lịch.
            </Text>
          </View>
        </>
      )}
    </Screen>
  );
}
