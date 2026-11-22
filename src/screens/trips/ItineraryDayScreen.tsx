import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { ClientApiError, errorMessage } from '../../api/http';
import {
  tripFlowApi,
  type ItineraryActivity,
  type ItineraryOverview,
  type TripActivityStatus,
  type TripProgressResponse,
} from '../../api/tripFlowApi';
import { weatherApi, type WeatherImpactedItem } from '../../api/weatherApi';
import PlacesMap, { hasCoordinate } from '../../components/PlacesMap';
import WeatherImpactBanner from '../../components/WeatherImpactBanner';
import type { RootScreenProps } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { Button, IconButton } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Header, Screen } from '../../ui/Screen';
import { EmptyState, ErrorState, Loading, Notice } from '../../ui/States';
import { Toast, useToast } from '../../ui/Toast';
import { formatDate, formatNumber, formatTime } from '../../utils/format';

const money = (amount: number | null | undefined, currency: string) =>
  amount === null || amount === undefined ? 'Chưa có ước tính' : `${formatNumber(amount)} ${currency}`;

function formatDuration(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (![sh, sm, eh, em].every(Number.isFinite)) return null;
  const minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours} giờ${rest ? ` ${rest} phút` : ''}` : `${rest} phút`;
}

function ActivityCard({
  activity,
  index,
  isLast,
  currency,
  status,
  onOpenPlace,
}: {
  activity: ItineraryActivity;
  index: number;
  isLast: boolean;
  currency: string;
  status?: TripActivityStatus;
  onOpenPlace: () => void;
}) {
  const duration = formatDuration(activity.startTime, activity.endTime);
  return (
    <View className="flex-row gap-3">
      <View className="items-center">
        <View className="mt-2 h-6 w-6 items-center justify-center rounded-full bg-[#DCF5F8]">
          <Text className="text-[11px] font-extrabold text-[#0E7490]">{index + 1}</Text>
        </View>
        {!isLast ? <View className="mt-1 w-0.5 flex-1 bg-[#BBE9EE]" /> : null}
      </View>
      <View style={shadow.card} className="mb-4 min-w-0 flex-1 rounded-[18px] border border-[#E8EDF1] bg-white p-3.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            <Icon name="schedule" size={16} color={colors.primary} />
            <Text className="text-[13.5px] font-extrabold text-[#0891B2]">
              {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
            </Text>
          </View>
          {duration ? (
            <View className="rounded-full bg-[#EFF0FD] px-2.5 py-1">
              <Text className="text-[10px] font-bold text-[#657796]">{duration}</Text>
            </View>
          ) : null}
        </View>
        <Pressable onPress={onOpenPlace} className="mt-2.5">
          <Text className="text-[14.5px] font-extrabold leading-5 text-[#13364A]">{activity.placeName}</Text>
          <Text numberOfLines={2} className="mt-1 text-[11.5px] leading-4 text-[#7E8DA7]">
            {activity.placeAddress || 'Chưa cập nhật địa chỉ'}
          </Text>
        </Pressable>
        <Text className="mt-1.5 text-[12px] font-extrabold text-[#0891B2]">{money(activity.estimatedCost, currency)}</Text>
        {activity.travelTimeMinutes !== null && activity.travelTimeMinutes > 0 ? (
          <View className="mt-2.5 flex-row items-center gap-2 rounded-xl bg-[#F4F7FB] px-3 py-2">
            <Icon name="directions-car" size={15} color="#617388" />
            <Text className="flex-1 text-[11px] text-[#617388]">
              Di chuyển ước tính: <Text className="font-bold">{activity.travelTimeMinutes} phút</Text>
              {activity.transportModeName ? ` · ${activity.transportModeName}` : ''}
            </Text>
          </View>
        ) : null}
        {activity.notes ? (
          <View className="mt-2 flex-row gap-2 rounded-xl bg-[#F0FAFB] px-3 py-2.5">
            <Icon name="info" size={15} color="#4B6C74" />
            <Text className="flex-1 text-[11px] leading-[17px] text-[#4B6C74]">{activity.notes}</Text>
          </View>
        ) : null}
        {status && status !== 'PENDING' ? (
          <View className="mt-2 flex-row items-center gap-1">
            <Icon name={status === 'COMPLETED' ? 'check-circle' : 'skip-next'} size={15} color={colors.primary} />
            <Text className="text-[11.5px] font-semibold text-[#0891B2]">{status === 'COMPLETED' ? 'Đã tham quan' : 'Đã bỏ qua'}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Chi tiết một ngày + bắt đầu / tiếp tục ngày tham quan — giống ItineraryDetailPage của web */
export default function ItineraryDayScreen({ navigation, route }: RootScreenProps<'ItineraryDay'>) {
  const { planId, day: dayNumber } = route.params;
  const [toast, showToast] = useToast();
  const [overview, setOverview] = useState<ItineraryOverview | null>(null);
  const [progress, setProgress] = useState<TripProgressResponse | null>(null);
  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [impactItems, setImpactItems] = useState<WeatherImpactedItem[]>([]);
  const [weatherVersion, setWeatherVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setError(null);
      Promise.all([tripFlowApi.overview(planId), tripFlowApi.tripProgress(planId)])
        .then(([data, latest]) => {
          if (!active) return;
          setOverview(data);
          setProgress(latest);
        })
        .catch((caught: unknown) => {
          if (!active) return;
          setError(
            caught instanceof ClientApiError && caught.status === 404
              ? 'Không tìm thấy lịch trình đang hoạt động của kế hoạch này.'
              : errorMessage(caught),
          );
        })
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [planId, retryCount]),
  );

  // Cảnh báo thời tiết (UC-045) — chỉ đề xuất, không tự sửa
  useEffect(() => {
    const itineraryId = overview?.itineraryId;
    if (!itineraryId) return;
    let active = true;
    weatherApi
      .impact(itineraryId)
      .then((result) => active && setImpactItems(result.impactedItems))
      .catch(() => active && setImpactItems([]));
    return () => {
      active = false;
    };
  }, [overview?.itineraryId, weatherVersion]);

  const days = useMemo(() => [...(overview?.days ?? [])].sort((a, b) => a.dayNumber - b.dayNumber), [overview]);
  const currentDay = days.find((item) => item.dayNumber === dayNumber);
  const activities = useMemo(() => [...(currentDay?.activities ?? [])].sort((a, b) => a.itemOrder - b.itemOrder), [currentDay]);
  const dayImpactItems = impactItems.filter((item) => item.dayNumber === dayNumber);
  const currentIndex = days.findIndex((item) => item.dayNumber === dayNumber);
  const previousDay = currentIndex > 0 ? days[currentIndex - 1] : null;
  const nextDay = currentIndex >= 0 ? (days[currentIndex + 1] ?? null) : null;
  const currency = overview?.currency ?? 'VND';

  const progressDay = progress?.days.find((item) => item.dayNumber === dayNumber);
  const executionStatus = progressDay?.status ?? 'NOT_STARTED';
  const activityStatuses = new Map((progressDay?.activities ?? []).map((entry) => [entry.itemId, entry.status]));
  const earlierUnfinished = progress?.days.find((entry) => entry.dayNumber < dayNumber && entry.status !== 'COMPLETED');
  const anotherRunning = progress?.days.find((entry) => entry.dayNumber !== dayNumber && entry.status === 'IN_PROGRESS');
  const startBlockedReason =
    executionStatus === 'NOT_STARTED'
      ? earlierUnfinished
        ? `Bạn cần hoàn thành Ngày ${earlierUnfinished.dayNumber} trước.`
        : anotherRunning
          ? `Ngày ${anotherRunning.dayNumber} đang thực hiện. Hãy hoàn thành ngày đó trước.`
          : null
      : null;

  const mapPoints = activities.filter(hasCoordinate).map((activity, index) => ({
    id: String(activity.itemId),
    latitude: activity.latitude,
    longitude: activity.longitude,
    label: String(index + 1),
    title: activity.placeName,
    color: activityStatuses.get(activity.itemId) === 'COMPLETED' ? colors.success : undefined,
  }));

  const beginDay = async () => {
    if (starting) return;
    if (startBlockedReason) return showToast(startBlockedReason);
    if (executionStatus === 'IN_PROGRESS') return navigation.navigate('LiveMap', { planId, day: dayNumber });
    if (executionStatus === 'COMPLETED') return;
    setStarting(true);
    try {
      await tripFlowApi.startTripDay(planId, dayNumber);
      navigation.navigate('LiveMap', { planId, day: dayNumber });
    } catch (caught) {
      showToast(errorMessage(caught));
      tripFlowApi.tripProgress(planId).then(setProgress).catch(() => undefined);
    } finally {
      setStarting(false);
    }
  };

  const shareDay = () => {
    if (!overview || !currentDay) return;
    void Share.share({
      message: [
        `${overview.itineraryTitle} — Ngày ${currentDay.dayNumber}`,
        `Ngày tham quan: ${formatDate(currentDay.visitDate)}`,
        ...activities.map((a, i) => `${i + 1}. ${formatTime(a.startTime)}–${formatTime(a.endTime)} ${a.placeName}`),
      ].join('\n'),
    });
  };

  const header = (
    <Header
      title={`Ngày ${dayNumber}`}
      subtitle={overview?.itineraryTitle}
      onBack={() => navigation.goBack()}
      right={overview && currentDay ? <IconButton icon="share" label="Chia sẻ lịch trình ngày" onPress={shareDay} /> : undefined}
    />
  );

  if (loading && !overview) {
    return (
      <Screen header={header}>
        <Loading label="Đang tải lịch trình..." />
      </Screen>
    );
  }
  if (error || !overview) {
    return (
      <Screen header={header}>
        <ErrorState message={error ?? 'Không tải được lịch trình.'} onRetry={() => setRetryCount((n) => n + 1)} />
      </Screen>
    );
  }
  if (!currentDay) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="event-busy"
          title={`Không tìm thấy ngày ${dayNumber}`}
          message="Ngày này không thuộc lịch trình đang hoạt động."
          action={<Button title="Xem tất cả các ngày" onPress={() => navigation.navigate('Itinerary', { planId })} />}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      footer={
        <View className="border-t border-[#EEF1F5] bg-white px-4 pb-4 pt-3">
          {executionStatus === 'COMPLETED' ? (
            <View className="flex-row items-center justify-center gap-2 rounded-full bg-[#E6F7F0] py-3.5">
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text className="text-[14px] font-bold text-[#13704F]">Ngày tham quan đã hoàn thành</Text>
            </View>
          ) : (
            <Button
              title={
                starting
                  ? 'Đang bắt đầu ngày...'
                  : executionStatus === 'IN_PROGRESS'
                    ? 'Tiếp tục chỉ đường'
                    : `Bắt đầu chuyến đi — Ngày ${dayNumber}`
              }
              icon={executionStatus === 'IN_PROGRESS' ? 'navigation' : 'flag'}
              loading={starting}
              disabled={Boolean(startBlockedReason) || activities.length === 0}
              onPress={() => void beginDay()}
            />
          )}
          {startBlockedReason ? <Text className="mt-2 text-center text-[11.5px] text-[#B45309]">{startBlockedReason}</Text> : null}
        </View>
      }
    >
      <View className="rounded-3xl bg-[#12344A] p-5">
        <Text className="text-[11px] font-semibold text-[#BCE6EB]">Lịch trình · Phiên bản {overview.versionNumber}</Text>
        <Text className="mt-1.5 text-[20px] font-extrabold leading-6 text-white">
          Ngày {currentDay.dayNumber}: {currentDay.title || formatDate(currentDay.visitDate)}
        </Text>
        <Text className="mt-1 text-[12.5px] text-[#DFF2F4]">
          {formatDate(currentDay.visitDate)} · {activities.length} hoạt động
        </Text>
        <View className="mt-3 flex-row gap-4">
          <Text className="text-[12px] text-[#C1E6EA]">
            Chi phí ngày: <Text className="font-bold text-white">{money(currentDay.estimatedCost, currency)}</Text>
          </Text>
        </View>
        <Text className="mt-1 text-[12px] text-[#C1E6EA]">
          Tổng chuyến đi: <Text className="font-bold text-white">{money(overview.totalEstimatedCost, currency)}</Text>
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 14 }}>
        {days.map((day) => {
          const active = day.dayNumber === dayNumber;
          return (
            <Pressable
              key={day.dayId}
              onPress={() => navigation.replace('ItineraryDay', { planId, day: day.dayNumber })}
              className={`rounded-full px-4 py-2 ${active ? 'bg-[#0891B2]' : 'border border-[#DCECF0] bg-white'}`}
            >
              <Text className={`text-[12.5px] font-bold ${active ? 'text-white' : 'text-[#13364A]'}`}>Ngày {day.dayNumber}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <WeatherImpactBanner
        itineraryId={overview.itineraryId}
        items={dayImpactItems}
        onApplied={() => {
          setWeatherVersion((v) => v + 1);
          setRetryCount((n) => n + 1);
        }}
      />

      {mapPoints.length > 0 ? (
        <View style={{ height: 200, borderRadius: 20, overflow: 'hidden', marginBottom: 14 }}>
          <PlacesMap points={mapPoints} />
        </View>
      ) : null}

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[16px] font-extrabold text-[#13364A]">Các hoạt động trong ngày</Text>
        <Text className="text-[12px] text-[#72818C]">{activities.length} hoạt động</Text>
      </View>

      {activities.length === 0 ? (
        <View className="rounded-2xl bg-white p-6">
          <Text className="text-center text-[13px] text-[#72818C]">Ngày này chưa có hoạt động được sắp xếp.</Text>
        </View>
      ) : (
        activities.map((activity, index) => (
          <ActivityCard
            key={activity.itemId}
            activity={activity}
            index={index}
            isLast={index === activities.length - 1}
            currency={currency}
            status={activityStatuses.get(activity.itemId)}
            onOpenPlace={() => navigation.navigate('PlaceDetail', { placeId: activity.placeId })}
          />
        ))
      )}

      <Notice tone="info">
        Giờ tham quan, thời gian di chuyển và chi phí do Backend ước tính. Lịch trình được sắp bằng thuật toán, không phải AI.
      </Notice>

      <View className="mt-1 flex-row gap-2.5">
        <View className="flex-1">
          <Button
            title="Ngày trước"
            icon="chevron-left"
            variant="outline"
            size="sm"
            disabled={!previousDay}
            onPress={() => previousDay && navigation.replace('ItineraryDay', { planId, day: previousDay.dayNumber })}
          />
        </View>
        <View className="flex-1">
          <Button
            title="Ngày tiếp theo"
            iconRight="chevron-right"
            variant="outline"
            size="sm"
            disabled={!nextDay}
            onPress={() => nextDay && navigation.replace('ItineraryDay', { planId, day: nextDay.dayNumber })}
          />
        </View>
      </View>
      <Button title="Về tổng quan" variant="ghost" size="sm" style={{ marginTop: 6 }} onPress={() => navigation.navigate('Itinerary', { planId })} />
      <Toast message={toast} />
    </Screen>
  );
}
