import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage } from '../../api/http';
import {
  tripFlowApi,
  type GoongVehicle,
  type ItineraryOverview,
  type NextTripRoute,
  type TripProgressResponse,
} from '../../api/tripFlowApi';
import PlacesMap, { hasCoordinate, type PlacesMapHandle } from '../../components/PlacesMap';
import ReviewForm from '../../components/ReviewForm';
import TodayWeatherCard from '../../components/TodayWeatherCard';
import type { RootScreenProps } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { Button, IconButton } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { ErrorState, Loading, Notice } from '../../ui/States';
import { Toast, useToast } from '../../ui/Toast';
import { formatTime } from '../../utils/format';
import { setNavigationLockScreen } from '../../utils/lockScreen';

type LatLng = { latitude: number; longitude: number };

const VEHICLES: { value: GoongVehicle; label: string }[] = [
  { value: 'car', label: 'Ô tô' },
  { value: 'bike', label: 'Xe máy' },
  { value: 'taxi', label: 'Taxi' },
];

/** Giải mã encoded polyline của Goong (giống web) */
function decodePolyline(encoded: string): LatLng[] {
  const coordinates: LatLng[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  while (index < encoded.length) {
    const numbers: number[] = [];
    for (let i = 0; i < 2; i++) {
      let shift = 0;
      let result = 0;
      let byte: number;
      do {
        if (index >= encoded.length || shift > 30) return [];
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      numbers.push(result & 1 ? ~(result >> 1) : result >> 1);
    }
    latitude += numbers[0];
    longitude += numbers[1];
    coordinates.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }
  return coordinates;
}

/** Khoảng cách đường chim bay (mét) */
function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const formatDistance = (meters: number) =>
  meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
const formatDurationSeconds = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút` : `${minutes} phút`;
};

/** Chỉ đường bằng GPS tới từng địa điểm trong ngày — giống TripLiveMapPage của web */
export default function LiveMapScreen({ navigation, route: navRoute }: RootScreenProps<'LiveMap'>) {
  const { planId, day: dayNumber } = navRoute.params;
  const mapRef = useRef<PlacesMapHandle>(null);
  const insets = useSafeAreaInsets();

  // Giữ sáng & hiển thị trên màn hình khóa khi đang mở màn hình dẫn đường chuyến đi
  useEffect(() => {
    setNavigationLockScreen(true);
    return () => setNavigationLockScreen(false);
  }, []);
  const [toast, showToast] = useToast();
  const [overview, setOverview] = useState<ItineraryOverview | null>(null);
  const [progress, setProgress] = useState<TripProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [vehicle, setVehicle] = useState<GoongVehicle>('car');
  const [location, setLocation] = useState<(LatLng & { accuracy: number | null }) | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsVersion, setGpsVersion] = useState(0);
  const [route, setRoute] = useState<NextTripRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [rerouteVersion, setRerouteVersion] = useState(0);
  const [reviewPlace, setReviewPlace] = useState<{ placeId: number; name: string } | null>(null);
  const lastRequest = useRef<{
    itemId: number;
    location: LatLng;
    vehicle: GoongVehicle;
    time: number;
  } | null>(null);
  const sequence = useRef(0);

  useEffect(() => {
    let active = true;
    setLoadError(null);
    Promise.all([tripFlowApi.overview(planId), tripFlowApi.tripProgress(planId)])
      .then(([data, latest]) => {
        if (!active) return;
        setOverview(data);
        setProgress(latest);
      })
      .catch((caught: unknown) => active && setLoadError(errorMessage(caught)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [planId, retry]);

  // Theo dõi GPS
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setGpsError('Cần cấp quyền vị trí để chỉ đường tới địa điểm tiếp theo.');
        return;
      }
      setGpsError(null);
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 15, timeInterval: 5000 },
        (position) => {
          if (cancelled) return;
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy ?? null,
          });
        },
      );
    })().catch((caught: unknown) => setGpsError(errorMessage(caught)));
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [gpsVersion]);

  const currentDay = overview?.days.find((entry) => entry.dayNumber === dayNumber);
  const progressDay = progress?.days.find((entry) => entry.dayNumber === dayNumber);
  const dayStatus = progressDay?.status ?? 'NOT_STARTED';
  const isRunning = dayStatus === 'IN_PROGRESS';
  const stops = useMemo(
    () => [...(currentDay?.activities ?? [])].sort((a, b) => a.itemOrder - b.itemOrder),
    [currentDay],
  );
  const statuses = useMemo(
    () => new Map((progressDay?.activities ?? []).map((item) => [item.itemId, item.status])),
    [progressDay],
  );
  const statusOf = (itemId: number) => statuses.get(itemId) ?? 'PENDING';
  const pendingStop = stops.find((item) => statusOf(item.itemId) === 'PENDING') ?? null;
  const completedCount = stops.filter((item) => statusOf(item.itemId) !== 'PENDING').length;
  const percent = stops.length ? Math.round((100 * completedCount) / stops.length) : 100;
  const allHandled = completedCount === stops.length;

  // Gọi Goong Directions qua Backend: đổi điểm đến/phương tiện thì tính lại; GPS thay đổi thì giới hạn tần suất
  useEffect(() => {
    if (!isRunning || !pendingStop || !location) {
      setRoute(null);
      setRouteError(null);
      lastRequest.current = null;
      return;
    }
    const now = Date.now();
    const last = lastRequest.current;
    if (last && last.itemId === pendingStop.itemId && last.vehicle === vehicle) {
      const moved = distanceMeters(last.location, location);
      const elapsed = now - last.time;
      if (elapsed < 12_000 || (moved < 80 && elapsed < 45_000)) return;
    }
    lastRequest.current = { itemId: pendingStop.itemId, location, vehicle, time: now };
    const requestId = ++sequence.current;
    setRouteLoading(true);
    setRouteError(null);
    tripFlowApi
      .nextTripRoute(
        planId,
        dayNumber,
        location.latitude,
        location.longitude,
        vehicle,
        location.accuracy ?? undefined,
      )
      .then((response) => {
        if (sequence.current === requestId) setRoute(response);
      })
      .catch((error: unknown) => {
        if (sequence.current !== requestId) return;
        setRouteError(errorMessage(error));
        setRoute(null);
      })
      .finally(() => {
        if (sequence.current === requestId) setRouteLoading(false);
      });
  }, [isRunning, pendingStop?.itemId, location, vehicle, planId, dayNumber, rerouteVersion]);

  const polyline = useMemo(
    () => (route?.route.polyline ? decodePolyline(route.route.polyline) : []),
    [route],
  );
  const mapPoints = stops.filter(hasCoordinate).map((item) => ({
    id: String(item.itemId),
    latitude: item.latitude,
    longitude: item.longitude,
    label: String(item.itemOrder),
    title: item.placeName,
    color:
      statusOf(item.itemId) === 'COMPLETED'
        ? colors.success
        : statusOf(item.itemId) === 'SKIPPED'
          ? '#9AA9B3'
          : undefined,
  }));

  const startDay = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setProgress(await tripFlowApi.startTripDay(planId, dayNumber));
      showToast(`Đã bắt đầu Ngày ${dayNumber}. Đang lấy vị trí GPS...`);
    } catch (error) {
      showToast(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const updateStop = async (status: 'COMPLETED' | 'SKIPPED') => {
    if (!pendingStop || busy) return;
    const stop = pendingStop;
    setBusy(true);
    try {
      setProgress(await tripFlowApi.updateTripActivity(planId, dayNumber, stop.itemId, status));
      setRoute(null);
      lastRequest.current = null;
      showToast(
        status === 'COMPLETED'
          ? `Đã hoàn thành: ${stop.placeName}`
          : `Đã bỏ qua: ${stop.placeName}`,
      );
      // Đã đến nơi → mời đánh giá địa điểm vừa tham quan
      if (status === 'COMPLETED') setReviewPlace({ placeId: stop.placeId, name: stop.placeName });
    } catch (error) {
      showToast(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const confirmSkip = () =>
    pendingStop &&
    Alert.alert(
      'Bỏ qua địa điểm này?',
      `Bỏ qua “${pendingStop.placeName}” và chuyển tới địa điểm tiếp theo?`,
      [
        { text: 'Giữ địa điểm', style: 'cancel' },
        { text: 'Bỏ qua', style: 'destructive', onPress: () => void updateStop('SKIPPED') },
      ],
    );

  const finishDay = () =>
    Alert.alert(
      `Hoàn thành Ngày ${dayNumber}?`,
      'Các địa điểm của ngày đã được hoàn thành hoặc bỏ qua. Tiến độ sẽ được lưu vĩnh viễn.',
      [
        { text: 'Để sau', style: 'cancel' },
        {
          text: 'Hoàn thành ngày',
          onPress: async () => {
            setBusy(true);
            try {
              setProgress(await tripFlowApi.completeTripDay(planId, dayNumber));
              setRoute(null);
              Alert.alert(
                `Đã hoàn thành Ngày ${dayNumber}`,
                'Tiến độ đã lưu thành công. Bạn có thể xem ngày tiếp theo trong lịch trình.',
                [
                  { text: 'Xem bản đồ', style: 'cancel' },
                  {
                    text: 'Về chi tiết lịch trình',
                    onPress: () => navigation.navigate('ItineraryDay', { planId, day: dayNumber }),
                  },
                ],
              );
            } catch (error) {
              showToast(errorMessage(error));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );

  const exit = () =>
    Alert.alert(
      'Đóng bản đồ?',
      'Tiến độ đã được lưu. Bạn có thể trở lại và tiếp tục hành trình sau.',
      [
        { text: 'Ở lại', style: 'cancel' },
        { text: 'Về lịch trình', onPress: () => navigation.goBack() },
      ],
    );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <Loading label="Đang tải hành trình..." />
      </SafeAreaView>
    );
  }
  if (loadError || !overview) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
        <ErrorState
          message={loadError ?? 'Không tải được lịch trình.'}
          onRetry={() => setRetry((n) => n + 1)}
        />
        <Button title="Quay lại" variant="ghost" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ height: '42%' }}>
        <PlacesMap
          ref={mapRef}
          points={mapPoints}
          activeId={pendingStop ? String(pendingStop.itemId) : null}
          route={polyline}
          userLocation={location}
        />
        <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <View className="flex-row items-center gap-2 px-3 pt-2">
            <IconButton icon="close" label="Đóng bản đồ" onPress={exit} background="#FFFFFF" />
            <View style={shadow.card} className="flex-1 rounded-full bg-white px-4 py-2">
              <Text numberOfLines={1} className="text-[13px] font-extrabold text-[#13364A]">
                Ngày {dayNumber} · {completedCount}/{stops.length} điểm · {percent}%
              </Text>
            </View>
            <IconButton
              icon="my-location"
              label="Vị trí của tôi"
              background="#FFFFFF"
              onPress={() =>
                location
                  ? mapRef.current?.focus(location.latitude, location.longitude, 0.01)
                  : setGpsVersion((v) => v + 1)
              }
            />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 + insets.bottom }}
      >
        <View className="mb-3 h-2 overflow-hidden rounded-full bg-[#E3E8EF]">
          <View style={{ width: `${percent}%`, height: '100%', backgroundColor: colors.success }} />
        </View>

        {pendingStop ? (
          <View style={shadow.card} className="rounded-3xl bg-white p-4">
            <Text className="text-[10.5px] font-extrabold uppercase tracking-[1.4px] text-[#0891B2]">
              Điểm tiếp theo
            </Text>
            <Text className="mt-1 text-[18px] font-extrabold text-[#13364A]">
              {pendingStop.placeName}
            </Text>
            <Text numberOfLines={2} className="mt-0.5 text-[12px] text-[#72818C]">
              {pendingStop.placeAddress || 'Chưa có địa chỉ'}
            </Text>
            <View className="mt-2 flex-row items-center gap-1">
              <Icon name="schedule" size={15} color={colors.primary} />
              <Text className="text-[12px] font-bold text-[#0E7490]">
                {formatTime(pendingStop.startTime)} – {formatTime(pendingStop.endTime)} · giờ dự
                kiến
              </Text>
            </View>
          </View>
        ) : (
          <View className="rounded-3xl bg-white p-4">
            <Text className="text-center text-[13px] text-[#72818C]">
              {stops.length === 0
                ? 'Ngày này không có địa điểm tham quan.'
                : 'Đã xử lý tất cả địa điểm của ngày.'}
            </Text>
          </View>
        )}

        {gpsError ? (
          <View className="mt-3">
            <Notice tone="warning" title="Chưa lấy được vị trí">
              {gpsError}
            </Notice>
            <Button
              title="Thử lấy GPS lại"
              variant="outline"
              size="sm"
              onPress={() => setGpsVersion((v) => v + 1)}
            />
          </View>
        ) : isRunning && !location ? (
          <Text className="mt-3 text-center text-[12px] text-[#72818C]">Đang lấy vị trí GPS…</Text>
        ) : null}

        {isRunning && pendingStop ? (
          <View style={shadow.card} className="mt-3 rounded-3xl bg-white p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-extrabold text-[#13364A]">Tuyến đường Goong</Text>
              <Pressable
                onPress={() => {
                  lastRequest.current = null;
                  setRerouteVersion((v) => v + 1);
                }}
                className="flex-row items-center gap-1"
              >
                <Icon name="refresh" size={16} color={colors.primary} />
                <Text className="text-[12px] font-bold text-[#0891B2]">Tính lại</Text>
              </Pressable>
            </View>
            <View className="mt-2.5 flex-row gap-2">
              {VEHICLES.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => setVehicle(item.value)}
                  className={`flex-1 items-center rounded-xl py-2 ${vehicle === item.value ? 'bg-[#0891B2]' : 'bg-[#EEF5F7]'}`}
                >
                  <Text
                    className={`text-[12.5px] font-bold ${vehicle === item.value ? 'text-white' : 'text-[#557080]'}`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {routeLoading && !route ? (
              <Text className="mt-3 text-[12px] text-[#72818C]">Đang tính đường đi…</Text>
            ) : null}
            {routeError ? (
              <View className="mt-3">
                <Notice tone="danger">{routeError}</Notice>
              </View>
            ) : null}
            {route ? (
              <View className="mt-3">
                <View className="flex-row gap-3">
                  <View className="flex-1 rounded-2xl bg-[#ECFEFF] p-3">
                    <Text className="text-[11px] text-[#557080]">Quãng đường</Text>
                    <Text className="text-[16px] font-extrabold text-[#0E7490]">
                      {route.route.distanceText ?? formatDistance(route.route.distanceMeters)}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-[#ECFEFF] p-3">
                    <Text className="text-[11px] text-[#557080]">Thời gian</Text>
                    <Text className="text-[16px] font-extrabold text-[#0E7490]">
                      {route.route.durationText ??
                        formatDurationSeconds(route.route.durationSeconds)}
                    </Text>
                  </View>
                </View>
                {route.arrived ? (
                  <View className="mt-2.5">
                    <Notice tone="success">
                      Bạn đã ở gần {route.placeName}. Bấm “Đã đến” khi tham quan xong.
                    </Notice>
                  </View>
                ) : null}
                {route.lowAccuracy ? (
                  <View className="mt-2.5">
                    <Notice tone="warning">Sai số GPS lớn, vị trí chỉ mang tính tham khảo.</Notice>
                  </View>
                ) : null}
                {(route.route.steps ?? []).length > 0 ? (
                  <View className="mt-3 gap-2">
                    {(route.route.steps ?? []).slice(0, 6).map((step, index) => (
                      <View key={index} className="flex-row gap-2.5">
                        <View className="h-6 w-6 items-center justify-center rounded-full bg-[#DCF5F8]">
                          <Text className="text-[10.5px] font-extrabold text-[#0E7490]">
                            {index + 1}
                          </Text>
                        </View>
                        <View className="min-w-0 flex-1">
                          <Text className="text-[12.5px] leading-[18px] text-[#13364A]">
                            {step.instruction}
                          </Text>
                          {step.distanceText ? (
                            <Text className="text-[11px] text-[#72818C]">{step.distanceText}</Text>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {pendingStop ? (
          <View className="mt-3">
            <TodayWeatherCard placeId={pendingStop.placeId} />
          </View>
        ) : null}

        {reviewPlace ? (
          <View className="mt-3">
            <Text className="mb-2 text-[14px] font-extrabold text-[#13364A]">
              Nhận xét {reviewPlace.name}
            </Text>
            <ReviewForm
              key={reviewPlace.placeId}
              placeId={reviewPlace.placeId}
              stopTitle={reviewPlace.name}
            />
          </View>
        ) : null}

        <View className="mt-4 gap-2.5">
          {dayStatus === 'NOT_STARTED' ? (
            <Button
              title={`Bắt đầu chuyến đi — Ngày ${dayNumber}`}
              icon="flag"
              loading={busy}
              onPress={() => void startDay()}
            />
          ) : null}
          {isRunning && pendingStop ? (
            <View className="flex-row gap-2.5">
              <View className="flex-1">
                <Button
                  title="Bỏ qua"
                  icon="skip-next"
                  variant="outline"
                  disabled={busy}
                  onPress={confirmSkip}
                />
              </View>
              <View className="flex-[1.6]">
                <Button
                  title="Đã đến · Tiếp tục"
                  icon="check-circle"
                  loading={busy}
                  onPress={() => void updateStop('COMPLETED')}
                />
              </View>
            </View>
          ) : null}
          {isRunning && allHandled ? (
            <Button
              title={`Hoàn thành Ngày ${dayNumber}`}
              icon="task-alt"
              loading={busy}
              onPress={finishDay}
            />
          ) : null}
          {dayStatus === 'COMPLETED' ? (
            <Button
              title="Về chi tiết lịch trình"
              variant="secondary"
              onPress={() => navigation.navigate('ItineraryDay', { planId, day: dayNumber })}
            />
          ) : null}
        </View>

        <Text className="mt-4 text-center text-[11px] leading-[17px] text-[#8193A0]">
          Goong cung cấp tuyến và thời gian dự kiến. Bạn tự xác nhận đã đến địa điểm; không tự động
          đánh dấu chỉ dựa vào GPS.
        </Text>
      </ScrollView>
      <Toast message={toast} />
    </View>
  );
}
