import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '../api/http';
import { mapsApi } from '../api/mapsApi';
import type { GoongRoute, GoongVehicle } from '../api/tripFlowApi';
import { colors } from '../theme';
import { Button, IconButton } from '../ui/Button';
import { Icon, type IconName } from '../ui/Icon';
import { Text } from '../ui/Typography';
import { formatMeters, formatSeconds, type Coordinate } from '../utils/navGeo';
import { useGpsTracker } from '../utils/useGpsTracker';
import { toLatLng, useNavigationGuidance } from '../utils/useNavigationGuidance';
import PlacesMap, { type PlacesMapHandle } from './PlacesMap';

type LatLng = { latitude: number; longitude: number };

const VEHICLES: { value: GoongVehicle; label: string; icon: IconName }[] = [
  { value: 'car', label: 'Ô tô', icon: 'directions-car' },
  { value: 'bike', label: 'Xe máy', icon: 'two-wheeler' },
];

/** Giải mã encoded polyline của Goong thành mảng tọa độ { latitude, longitude } */
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

const formatDistance = (meters: number) =>
  meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;

const formatDurationSeconds = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút` : `${minutes} phút`;
};

interface PlaceDirectionsMapProps {
  placeId: number;
  placeName: string;
  address: string | null;
  latitude: number;
  longitude: number;
  /** API /maps/directions yêu cầu đăng nhập để bảo vệ quota Goong */
  isAuthenticated: boolean;
  onRequireLogin: () => void;
  /** Tăng số này để mở modal bản đồ Goong từ bên ngoài (vd. bấm vào dòng địa chỉ) */
  openMapSignal?: number;
}

/**
 * Khung "Vị trí & Đường đi" trên màn chi tiết địa điểm Mobile:
 * dùng hoàn toàn Goong Map (MapLibre + Goong Directions qua BE), không nhảy sang Google Maps.
 */
export default function PlaceDirectionsMap({
  placeId,
  placeName,
  address,
  latitude,
  longitude,
  isAuthenticated,
  onRequireLogin,
  openMapSignal = 0,
}: PlaceDirectionsMapProps) {
  const inlineMapRef = useRef<PlacesMapHandle>(null);
  const modalMapRef = useRef<PlacesMapHandle>(null);

  const [vehicle, setVehicle] = useState<GoongVehicle>('car');
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<GoongRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [following, setFollowing] = useState(true);

  // Dẫn đường: GPS đã lọc vị trí xấu, bám tuyến, chỉ dẫn rẽ, tự tính lại khi đi lệch
  const tracker = useGpsTracker(navigating);
  const destination = useMemo(
    () => ({ name: placeName, coordinate: [latitude, longitude] as Coordinate }),
    [placeName, latitude, longitude],
  );

  const routeCoords = useMemo(
    () => (route?.polyline ? decodePolyline(route.polyline) : undefined),
    [route],
  );

  const stopNavigation = useCallback(() => {
    setNavigating(false);
  }, []);

  // Đổi địa điểm → xóa tuyến cũ và dừng dẫn đường
  useEffect(() => {
    stopNavigation();
    setRoute(null);
    setError(null);
    setExpanded(false);
  }, [placeId, stopNavigation]);

  // Đóng modal hoặc unmount → dừng theo dõi GPS để tiết kiệm pin
  useEffect(() => {
    if (!expanded) stopNavigation();
  }, [expanded, stopNavigation]);

  useEffect(() => stopNavigation, [stopNavigation]);

  const handledOpenRef = useRef(openMapSignal);
  useEffect(() => {
    if (openMapSignal === handledOpenRef.current) return;
    handledOpenRef.current = openMapSignal;
    setExpanded(true);
  }, [openMapSignal]);

  const fetchRoute = useCallback(
    async (origin: LatLng, mode: GoongVehicle) => {
      setLoading(true);
      setError(null);
      try {
        const result = await mapsApi.directions({
          fromLat: origin.latitude,
          fromLng: origin.longitude,
          toLat: latitude,
          toLng: longitude,
          vehicle: mode,
        });
        setRoute(result);
      } catch (failure: unknown) {
        setRoute(null);
        setError(errorMessage(failure));
      } finally {
        setLoading(false);
      }
    },
    [latitude, longitude],
  );

  const startDirections = useCallback(
    async (mode: GoongVehicle = vehicle) => {
      if (!isAuthenticated) {
        onRequireLogin();
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          setLoading(false);
          setError('Bạn cần cấp quyền vị trí để xem đường đi từ vị trí hiện tại.');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const origin: LatLng = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserLocation(origin);
        await fetchRoute(origin, mode);
      } catch {
        setLoading(false);
        setError('Không lấy được vị trí GPS hiện tại. Vui lòng bật định vị và thử lại.');
      }
    },
    [fetchRoute, isAuthenticated, onRequireLogin, vehicle],
  );

  const changeVehicle = (next: GoongVehicle) => {
    setVehicle(next);
    if (userLocation) {
      void fetchRoute(userLocation, next);
    } else {
      void startDirections(next);
    }
  };

  const clearDirections = () => {
    stopNavigation();
    setRoute(null);
    setError(null);
    inlineMapRef.current?.focus(latitude, longitude);
  };

  /** Bắt đầu / dừng chế độ dẫn đường GPS realtime trong modal bản đồ Goong */
  const toggleNavigation = useCallback(async () => {
    if (navigating) {
      stopNavigation();
      modalMapRef.current?.fitAll();
      return;
    }
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    if (!route) {
      await startDirections(vehicle);
    }
    setError(null);
    setFollowing(true);
    setNavigating(true);
  }, [isAuthenticated, navigating, onRequireLogin, route, startDirections, stopNavigation, vehicle]);

  const nav = useNavigationGuidance({
    route,
    fix: navigating ? tracker.fix : null,
    destination,
    loading,
    active: navigating,
    // Đi lệch tuyến → tính lại từ vị trí hiện tại
    onOffRoute: () => {
      if (tracker.fix) void fetchRoute(toLatLng(tracker.fix.coordinate), vehicle);
    },
  });

  const todoLine = useMemo(() => (route ? nav.parts.todo.map(toLatLng) : undefined), [route, nav.parts.todo]);
  const doneLine = useMemo(() => nav.parts.done.map(toLatLng), [nav.parts.done]);
  const modalUser = useMemo(
    () => (navigating && nav.displayLocation ? toLatLng(nav.displayLocation) : userLocation),
    [navigating, nav.displayLocation, userLocation],
  );

  const points = useMemo(
    () => [{ id: String(placeId), latitude, longitude, label: '•', title: placeName }],
    [latitude, longitude, placeId, placeName],
  );

  const distanceLabel = route ? (route.distanceText ?? formatDistance(route.distanceMeters)) : null;
  const durationLabel = route
    ? (route.durationText ?? formatDurationSeconds(route.durationSeconds))
    : null;
  // Khi đang dẫn đường: số liệu còn lại theo vị trí thật
  const liveLabel =
    navigating && nav.remaining ? `${formatMeters(nav.remaining.meters)} · ${formatSeconds(nav.remaining.seconds)}` : null;

  return (
    <View className="mt-6">
      <View className="mb-2.5 flex-row items-center justify-between">
        <Text className="text-[16px] font-extrabold text-[#13364A]">Vị trí & Đường đi</Text>
        {route ? (
          <Pressable onPress={clearDirections} hitSlop={8}>
            <Text className="text-[12.5px] font-bold text-[#64748B]">Đóng chỉ đường</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Thanh tóm tắt tuyến Goong */}
      {route || error ? (
        <View className="mb-2.5 rounded-2xl border border-[#DCEBEF] bg-[#F4FBFD] px-3.5 py-2.5">
          {error ? (
            <View className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-[12.5px] text-[#B91C1C]">{error}</Text>
              <Pressable
                onPress={() => void startDirections(vehicle)}
                className="rounded-full bg-white px-3 py-1"
              >
                <Text className="text-[12px] font-bold text-[#0891B2]">Thử lại</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Icon name="directions" size={17} color={colors.primary} />
                <Text className="text-[13.5px] font-extrabold text-[#13364A]">
                  {distanceLabel} · {durationLabel}
                </Text>
              </View>
              <View className="flex-row gap-2">
                {VEHICLES.map((item) => {
                  const active = vehicle === item.value;
                  return (
                    <Pressable
                      key={item.value}
                      disabled={loading}
                      onPress={() => changeVehicle(item.value)}
                      className="flex-row items-center gap-1 rounded-full px-3 py-1"
                      style={{ backgroundColor: active ? colors.primary : '#FFFFFF' }}
                    >
                      <Icon name={item.icon} size={14} color={active ? '#FFFFFF' : '#475569'} />
                      <Text
                        className="text-[12px] font-bold"
                        style={{ color: active ? '#FFFFFF' : '#475569' }}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      ) : null}

      <View style={{ height: 210, borderRadius: 20, overflow: 'hidden' }}>
        <PlacesMap
          ref={inlineMapRef}
          points={points}
          activeId={String(placeId)}
          route={routeCoords}
          userLocation={userLocation}
        />
      </View>

      <View className="mt-3 flex-row gap-3">
        <View className="flex-1">
          <Button
            title={loading ? 'Đang tìm...' : route ? 'Cập nhật đường đi' : 'Chỉ đường'}
            icon="directions"
            loading={loading}
            onPress={() => void startDirections(vehicle)}
          />
        </View>
        <View className="flex-1">
          <Button
            title="Mở Bản Đồ"
            icon="map"
            variant="outline"
            onPress={() => setExpanded(true)}
          />
        </View>
      </View>

      {/* Modal phóng to bản đồ Goong + danh sách bước rẽ */}
      <Modal visible={expanded} animationType="slide" onRequestClose={() => setExpanded(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View className="flex-row items-center justify-between gap-2 border-b border-[#E5ECEF] px-4 py-3">
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="text-[15.5px] font-extrabold text-[#13364A]">
                {placeName}
              </Text>
              {address ? (
                <Text numberOfLines={1} className="text-[12px] text-[#72818C]">
                  {address}
                </Text>
              ) : null}
            </View>
            <IconButton icon="close" label="Đóng bản đồ" onPress={() => setExpanded(false)} />
          </View>

          <View className="flex-row items-center justify-between gap-2 border-b border-[#EEF1F4] bg-[#F8FBFD] px-4 py-2">
            <View className="flex-row gap-1.5">
              {VEHICLES.map((item) => {
                const active = vehicle === item.value && Boolean(route);
                return (
                  <Pressable
                    key={item.value}
                    disabled={loading}
                    onPress={() => changeVehicle(item.value)}
                    className="flex-row items-center gap-1 rounded-full px-3 py-1.5"
                    style={{ backgroundColor: active ? colors.primary : '#E8EEF2' }}
                  >
                    <Icon name={item.icon} size={15} color={active ? '#FFFFFF' : '#334E68'} />
                    <Text
                      className="text-[12px] font-bold"
                      style={{ color: active ? '#FFFFFF' : '#334E68' }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Button
              title={
                loading
                  ? 'Đang tìm...'
                  : !route
                    ? 'Chỉ đường'
                    : navigating
                      ? 'Dừng đi'
                      : 'Bắt đầu đi'
              }
              icon={!route ? 'directions' : navigating ? 'stop' : 'navigation'}
              variant={navigating ? 'danger' : 'primary'}
              size="sm"
              full={false}
              loading={loading}
              onPress={() => void (route ? toggleNavigation() : startDirections(vehicle))}
            />
          </View>

          <View style={{ flex: 1 }}>
            <PlacesMap
              ref={modalMapRef}
              points={points}
              activeId={String(placeId)}
              route={navigating ? todoLine : routeCoords}
              doneRoute={navigating ? doneLine : undefined}
              userLocation={modalUser}
              userHeading={navigating ? (tracker.fix?.heading ?? null) : null}
              userAccuracy={navigating ? (tracker.fix?.accuracy ?? null) : null}
              followUser={navigating && following}
              onUserInteract={() => setFollowing(false)}
            />

            {navigating ? (
              <View pointerEvents="box-none" style={{ position: 'absolute', top: 8, left: 12, right: 12, gap: 8 }}>
                {tracker.suspicious ? (
                  <View className="rounded-2xl bg-[#B45309] px-4 py-3">
                    <Text className="text-[12.5px] font-bold leading-[17px] text-white">
                      {tracker.message} Hãy thử bật lại GPS.
                    </Text>
                    <Pressable onPress={tracker.retry} className="mt-2 self-start rounded-full bg-white/25 px-3 py-1.5">
                      <Text className="text-[11.5px] font-extrabold text-white">Thử GPS lại</Text>
                    </Pressable>
                  </View>
                ) : nav.guidance ? (
                  <View
                    className={`flex-row items-center gap-3 rounded-2xl px-4 py-3 ${
                      nav.guidance.icon === 'alt-route' ? 'bg-[#B45309]' : nav.arrived ? 'bg-[#13936B]' : 'bg-[#13364A]'
                    }`}
                  >
                    <Icon name={nav.guidance.icon as IconName} size={36} color="#FFFFFF" />
                    <View className="min-w-0 flex-1">
                      <Text className="text-[19px] font-extrabold leading-[23px] text-white">{nav.guidance.title}</Text>
                      <Text numberOfLines={2} className="mt-0.5 text-[12.5px] font-semibold leading-[17px] text-white/90">
                        {nav.guidance.text}
                      </Text>
                    </View>
                  </View>
                ) : !tracker.fix ? (
                  <View className="rounded-2xl bg-[#13364A] px-4 py-3">
                    <Text className="text-[12.5px] font-bold text-white">{tracker.message}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {navigating ? (
              <View style={{ position: 'absolute', right: 12, bottom: 12 }}>
                <IconButton
                  icon="my-location"
                  label="Bám theo vị trí"
                  background={following ? colors.primary : '#FFFFFF'}
                  color={following ? '#FFFFFF' : colors.primary}
                  onPress={() => setFollowing(true)}
                />
              </View>
            ) : null}
          </View>

          {route || error ? (
            <View style={{ maxHeight: '36%' }} className="border-t border-[#E5ECEF] bg-white">
              {error ? (
                <Text className="p-4 text-[13px] text-[#B91C1C]">{error}</Text>
              ) : (
                <>
                  <View className="border-b border-[#EEF1F4] px-4 py-2.5">
                    <Text className="text-[11px] font-bold uppercase text-[#72818C]">
                      Tuyến đường Goong Maps
                    </Text>
                    <Text className="mt-0.5 text-[15px] font-extrabold text-[#13364A]">
                      {liveLabel ?? `${distanceLabel} · ${durationLabel}`}
                    </Text>
                  </View>
                  <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                    {route?.steps && route.steps.length > 0 ? (
                      route.steps.map((step, idx) => (
                        <View
                          key={idx}
                          className={`flex-row items-start gap-2.5 py-2 ${idx > 0 ? 'border-t border-[#EEF1F4]' : ''}`}
                        >
                          <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-[#E7F8FA]">
                            <Icon name="navigation" size={14} color={colors.primary} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-[13px] leading-[18px] text-[#13364A]">
                              {step.instruction}
                            </Text>
                            <Text className="mt-0.5 text-[11px] text-[#72818C]">
                              {step.distanceText ?? formatDistance(step.distanceMeters)}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text className="py-2 text-[12.5px] text-[#72818C]">
                        Đã hiển thị tuyến đường trên bản đồ Goong.
                      </Text>
                    )}
                  </ScrollView>
                </>
              )}
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
