import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '../api/http';
import { mapsApi, type NearbyPlace } from '../api/mapsApi';
import type { GoongRoute, GoongRouteStep, GoongVehicle } from '../api/tripFlowApi';
import { colors, shadow } from '../theme';
import { Button, IconButton } from '../ui/Button';
import { Icon, type IconName } from '../ui/Icon';
import { FadeInView } from '../ui/Motion';
import { Text } from '../ui/Typography';
import { setNavigationLockScreen } from '../utils/lockScreen';
import { buildStepSpeech, speakNavigation, stopNavigationSpeech } from '../utils/voiceGuidance';
import PlacesMap, {
  type MapPoint,
  type PlacesMapHandle,
  type RouteOptionOverlay,
} from './PlacesMap';

type LatLng = { latitude: number; longitude: number };

const VEHICLES: { value: GoongVehicle; label: string; icon: IconName }[] = [
  { value: 'car', label: 'Ô tô', icon: 'directions-car' },
  { value: 'bike', label: 'Xe máy', icon: 'two-wheeler' },
];

const DETOUR_COLOR = '#EA580C';
const ARRIVAL_DETOUR_METERS = 60;

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

/** Khoảng cách đường chim bay (mét) giữa hai tọa độ */
function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const formatDistance = (meters: number) =>
  meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;

const formatDurationSeconds = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút` : `${minutes} phút`;
};

/** Giờ đến nơi dự kiến (HH:mm) */
function formatEta(durationSeconds: number): string {
  const arrival = new Date(Date.now() + durationSeconds * 1000);
  const hh = String(arrival.getHours()).padStart(2, '0');
  const mm = String(arrival.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Đổi maneuver của Goong sang icon mũi tên giống Google Maps */
function maneuverIcon(maneuver: string | null | undefined): IconName {
  const m = (maneuver ?? '').toLowerCase();
  if (m.includes('uturn')) return 'u-turn-left';
  if (m.includes('roundabout')) return 'roundabout-right';
  if (m.includes('sharp-left') || m === 'turn-left' || m.includes('left')) return 'turn-left';
  if (m.includes('sharp-right') || m === 'turn-right' || m.includes('right')) return 'turn-right';
  if (m.includes('straight')) return 'straight';
  return 'navigation';
}

/** Chọn bước rẽ gần vị trí GPS hiện tại nhất để hiển thị trên banner dẫn đường */
function activeStepIndex(steps: GoongRouteStep[], location: LatLng | null): number {
  if (steps.length === 0 || !location) return 0;
  let bestIndex = 0;
  let bestDist = Infinity;
  for (let i = 0; i < steps.length; i++) {
    const d = distanceMeters(location, {
      latitude: steps[i].startLatitude,
      longitude: steps[i].startLongitude,
    });
    if (d < bestDist) {
      bestDist = d;
      bestIndex = i;
    }
  }
  return bestIndex;
}

interface PlaceDirectionsMapProps {
  placeId: number;
  placeName: string;
  address: string | null;
  latitude: number;
  longitude: number;
  /** API /maps/directions & /maps/nearby yêu cầu đăng nhập để bảo vệ quota Goong */
  isAuthenticated: boolean;
  onRequireLogin: () => void;
  /** Tăng số này để mở modal bản đồ Goong từ bên ngoài (vd. bấm vào dòng địa chỉ) */
  openMapSignal?: number;
}

/**
 * Khung "Vị trí & Đường đi" trên màn chi tiết địa điểm Mobile:
 * dùng hoàn toàn Goong Map, có chế độ dẫn đường giống Google Maps và ghé tạm cây xăng gần nhất.
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
  const [cameraPaused, setCameraPaused] = useState(false);
  const cameraPausedRef = useRef(false);
  const [showStepsInNav, setShowStepsInNav] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [showRoutesPanel, setShowRoutesPanel] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const lastSpokenKeyRef = useRef<string | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const pauseCamera = useCallback(() => {
    cameraPausedRef.current = true;
    setCameraPaused(true);
  }, []);

  const resumeCamera = useCallback(
    (target?: LatLng | null) => {
      cameraPausedRef.current = false;
      setCameraPaused(false);
      const loc = target ?? userLocation;
      if (loc) {
        modalMapRef.current?.focus(loc.latitude, loc.longitude, 0.004);
      }
    },
    [userLocation],
  );

  // Tìm cây xăng gần & chế độ rẽ tạm (detour)
  const [gasStations, setGasStations] = useState<NearbyPlace[]>([]);
  const [gasLoading, setGasLoading] = useState(false);
  const [gasError, setGasError] = useState<string | null>(null);
  const [showGasPanel, setShowGasPanel] = useState(false);
  const [detourStop, setDetourStop] = useState<NearbyPlace | null>(null);
  const [detourRoute, setDetourRoute] = useState<GoongRoute | null>(null);

  // Danh sách toàn bộ tuyến chính + tuyến thay thế do Goong trả về
  const allMainRoutes = useMemo<GoongRoute[]>(
    () => (route ? [route, ...(route.alternatives ?? [])] : []),
    [route],
  );
  const selectedMainRoute = allMainRoutes[selectedRouteIndex] ?? route;
  const otherMainRoute =
    allMainRoutes.length > 1
      ? (allMainRoutes.find((_, idx) => idx !== selectedRouteIndex) ?? null)
      : null;

  const mainRouteCoords = useMemo(
    () => (selectedMainRoute?.polyline ? decodePolyline(selectedMainRoute.polyline) : undefined),
    [selectedMainRoute],
  );
  const otherMainRouteCoords = useMemo(
    () => (otherMainRoute?.polyline ? decodePolyline(otherMainRoute.polyline) : undefined),
    [otherMainRoute],
  );
  const detourRouteCoords = useMemo(
    () => (detourRoute?.polyline ? decodePolyline(detourRoute.polyline) : undefined),
    [detourRoute],
  );

  // Tuyến đang dẫn đường: nếu đang ghé cây xăng thì tuyến cây xăng thay thế tuyến chính
  const activeRoute = detourStop && detourRoute ? detourRoute : selectedMainRoute;
  const activeRouteCoords = detourStop && detourRouteCoords ? detourRouteCoords : mainRouteCoords;
  const secondaryRouteCoords =
    detourStop && detourRouteCoords ? mainRouteCoords : otherMainRouteCoords;

  const stopNavigation = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
    stopNavigationSpeech();
    lastSpokenKeyRef.current = null;
    cameraPausedRef.current = false;
    setCameraPaused(false);
    setNavigating(false);
    setShowStepsInNav(false);
    setShowRoutesPanel(false);
  }, []);

  // Đổi địa điểm → xóa tuyến cũ, cây xăng và dừng dẫn đường
  useEffect(() => {
    stopNavigation();
    setRoute(null);
    setDetourStop(null);
    setDetourRoute(null);
    setGasStations([]);
    setShowGasPanel(false);
    setGasError(null);
    setError(null);
    setExpanded(false);
  }, [placeId, stopNavigation]);

  // Đóng modal hoặc unmount → dừng theo dõi GPS để tiết kiệm pin
  useEffect(() => {
    if (!expanded) {
      stopNavigation();
      setShowGasPanel(false);
    }
  }, [expanded, stopNavigation]);

  useEffect(() => stopNavigation, [stopNavigation]);

  // Chỉ bật hiển thị đè lên màn hình khóa + giữ sáng khi đang ở chế độ dẫn đường
  useEffect(() => {
    setNavigationLockScreen(navigating);
    return () => setNavigationLockScreen(false);
  }, [navigating]);

  const handledOpenRef = useRef(openMapSignal);
  useEffect(() => {
    if (openMapSignal === handledOpenRef.current) return;
    handledOpenRef.current = openMapSignal;
    setExpanded(true);
  }, [openMapSignal]);

  /** Lấy tọa độ GPS hiện tại (dùng lại tọa độ đã có nếu không cần ép lấy mới) */
  const resolveOrigin = useCallback(async (): Promise<LatLng | null> => {
    if (userLocation) return userLocation;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Bạn cần cấp quyền vị trí để xem đường đi từ vị trí hiện tại.');
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const origin: LatLng = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setUserLocation(origin);
      return origin;
    } catch {
      setError('Không lấy được vị trí GPS hiện tại. Vui lòng bật định vị và thử lại.');
      return null;
    }
  }, [userLocation]);

  const fetchMainRoute = useCallback(
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
        setSelectedRouteIndex(0);
      } catch (failure: unknown) {
        setRoute(null);
        setError(errorMessage(failure));
      } finally {
        setLoading(false);
      }
    },
    [latitude, longitude],
  );

  const fetchDetourRoute = useCallback(
    async (origin: LatLng, station: NearbyPlace, mode: GoongVehicle) => {
      setLoading(true);
      setError(null);
      try {
        const result = await mapsApi.directions({
          fromLat: origin.latitude,
          fromLng: origin.longitude,
          toLat: station.latitude,
          toLng: station.longitude,
          vehicle: mode,
        });
        setDetourStop(station);
        setDetourRoute(result);
        setShowGasPanel(false);
        // Nếu đang ở chế độ dẫn đường thì tạm dừng bám camera & zoom toàn tuyến tới cây xăng mới
        if (navigating) {
          pauseCamera();
        }
        setTimeout(() => modalMapRef.current?.fitAll(), 220);
      } catch (failure: unknown) {
        setError(errorMessage(failure));
      } finally {
        setLoading(false);
      }
    },
    [navigating, pauseCamera],
  );

  const startDirections = useCallback(
    async (mode: GoongVehicle = vehicle) => {
      if (!isAuthenticated) {
        onRequireLogin();
        return;
      }
      setLoading(true);
      setError(null);
      const origin = await resolveOrigin();
      if (!origin) {
        setLoading(false);
        return;
      }
      await fetchMainRoute(origin, mode);
    },
    [fetchMainRoute, isAuthenticated, onRequireLogin, resolveOrigin, vehicle],
  );

  const changeVehicle = (next: GoongVehicle) => {
    setVehicle(next);
    if (detourStop && userLocation) {
      void fetchDetourRoute(userLocation, detourStop, next);
      return;
    }
    if (userLocation) {
      void fetchMainRoute(userLocation, next);
    } else {
      void startDirections(next);
    }
  };

  const clearDirections = () => {
    stopNavigation();
    setRoute(null);
    setDetourStop(null);
    setDetourRoute(null);
    setGasStations([]);
    setShowGasPanel(false);
    setError(null);
    inlineMapRef.current?.focus(latitude, longitude);
  };

  /** Tìm các cây xăng gần vị trí hiện tại qua Goong (dùng lại cache nếu đã tải để mở tức thì) */
  const searchNearbyGas = useCallback(async () => {
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    if (showGasPanel) {
      setShowGasPanel(false);
      return;
    }
    setShowGasPanel(true);
    setShowStepsInNav(false);
    // Đã có danh sách cây xăng vừa tìm → mở ngay không cần gọi lại Goong
    if (gasStations.length > 0) {
      setGasError(null);
      return;
    }
    setGasLoading(true);
    setGasError(null);
    const origin = await resolveOrigin();
    if (!origin) {
      setGasLoading(false);
      setGasError('Chưa có vị trí GPS để tìm cây xăng gần bạn.');
      return;
    }
    try {
      const found = await mapsApi.nearby({
        lat: origin.latitude,
        lng: origin.longitude,
        keyword: 'cây xăng',
        radius: 5,
      });
      setGasStations(found);
      if (found.length === 0) {
        setGasError('Không tìm thấy cây xăng nào trong bán kính 5 km.');
      }
    } catch (failure: unknown) {
      setGasError(errorMessage(failure));
    } finally {
      setGasLoading(false);
    }
  }, [gasStations.length, isAuthenticated, onRequireLogin, resolveOrigin, showGasPanel]);

  /** Chọn 1 cây xăng để rẽ qua (thay thế tuyến chính bằng tuyến tới cây xăng) */
  const selectGasStation = useCallback(
    async (station: NearbyPlace) => {
      const origin = await resolveOrigin();
      if (!origin) return;
      await fetchDetourRoute(origin, station, vehicle);
    },
    [fetchDetourRoute, resolveOrigin, vehicle],
  );

  /** Rời chế độ đi cây xăng → tính lại tuyến chính từ vị trí hiện tại đi tiếp tới địa điểm */
  const returnToMainRoute = useCallback(async () => {
    setDetourStop(null);
    setDetourRoute(null);
    setShowGasPanel(false);
    setGasStations([]);
    const origin = await resolveOrigin();
    if (origin) {
      await fetchMainRoute(origin, vehicle);
    }
  }, [fetchMainRoute, resolveOrigin, vehicle]);

  /** Bắt đầu / dừng chế độ dẫn đường GPS realtime giống Google Maps */
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
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Bạn cần cấp quyền vị trí để bắt đầu dẫn đường.');
        return;
      }
      setNavigating(true);
      cameraPausedRef.current = false;
      setCameraPaused(false);
      setShowStepsInNav(false);
      if (userLocation) {
        modalMapRef.current?.focus(userLocation.latitude, userLocation.longitude, 0.004);
      }
      watchRef.current?.remove();
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
        (pos) => {
          const next: LatLng = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setUserLocation(next);
          // Chỉ kéo camera bám theo khi người dùng không tạm dừng để xem bản đồ / xem toàn tuyến
          if (!cameraPausedRef.current) {
            modalMapRef.current?.focus(next.latitude, next.longitude, 0.004);
          }
        },
      );
    } catch {
      stopNavigation();
      setError('Không thể theo dõi GPS lúc này. Vui lòng thử lại.');
    }
  }, [
    isAuthenticated,
    navigating,
    onRequireLogin,
    route,
    startDirections,
    stopNavigation,
    userLocation,
    vehicle,
  ]);

  // Khi mở khay cây xăng và đã có danh sách → tạm dừng bám GPS & zoom cận vừa khít các cây xăng quanh bạn
  useEffect(() => {
    if (!showGasPanel || gasStations.length === 0) return;
    if (navigating) pauseCamera();
    const targets: LatLng[] = gasStations.map((s) => ({
      latitude: s.latitude,
      longitude: s.longitude,
    }));
    if (userLocation) targets.push(userLocation);
    const timer = setTimeout(() => modalMapRef.current?.fitPoints(targets), 380);
    return () => clearTimeout(timer);
  }, [gasStations, navigating, pauseCamera, showGasPanel, userLocation]);

  // Danh sách toàn bộ tuyến (đang chọn + thay thế) kèm nhãn thời gian để vẽ đồng thời giống Google Maps
  const routeOptionOverlays = useMemo<RouteOptionOverlay[] | undefined>(() => {
    if (detourStop || allMainRoutes.length < 2) return undefined;
    // Khi đang bám GPS cận cảnh thì ẩn nhãn để đỡ rối; hiện khi xem trước, đang chọn tuyến, hoặc đang xem toàn tuyến
    if (navigating && !cameraPaused && !showRoutesPanel) return undefined;
    return allMainRoutes.map((option, idx) => {
      const diffMin = Math.round((option.durationSeconds - allMainRoutes[0].durationSeconds) / 60);
      return {
        index: idx,
        coordinates: option.polyline ? decodePolyline(option.polyline) : [],
        durationLabel: option.durationText ?? formatDurationSeconds(option.durationSeconds),
        distanceLabel: option.distanceText ?? formatDistance(option.distanceMeters),
        diffLabel:
          idx > 0 && diffMin !== 0 ? `${diffMin > 0 ? `+${diffMin}` : diffMin}p` : undefined,
        selected: idx === selectedRouteIndex,
      };
    });
  }, [allMainRoutes, cameraPaused, detourStop, navigating, selectedRouteIndex, showRoutesPanel]);

  const inlinePoints = useMemo<MapPoint[]>(
    () => [{ id: String(placeId), latitude, longitude, label: '•', title: placeName }],
    [latitude, longitude, placeId, placeName],
  );

  const modalPoints = useMemo<MapPoint[]>(() => {
    const list: MapPoint[] = [
      { id: String(placeId), latitude, longitude, label: '•', title: placeName },
    ];
    if (detourStop) {
      list.push({
        id: `gas:${detourStop.placeId}`,
        latitude: detourStop.latitude,
        longitude: detourStop.longitude,
        label: '⛽',
        title: detourStop.name,
        color: DETOUR_COLOR,
      });
    } else if (showGasPanel) {
      for (const station of gasStations) {
        list.push({
          id: `gas:${station.placeId}`,
          latitude: station.latitude,
          longitude: station.longitude,
          label: '⛽',
          title: station.name,
          color: DETOUR_COLOR,
        });
      }
    }
    return list;
  }, [detourStop, gasStations, latitude, longitude, placeId, placeName, showGasPanel]);

  const arrivedAtDetour = useMemo(() => {
    if (!detourStop || !userLocation) return false;
    return (
      distanceMeters(userLocation, {
        latitude: detourStop.latitude,
        longitude: detourStop.longitude,
      }) <= ARRIVAL_DETOUR_METERS
    );
  }, [detourStop, userLocation]);

  const steps = activeRoute?.steps ?? [];
  const stepIdx = useMemo(() => activeStepIndex(steps, userLocation), [steps, userLocation]);
  const currentStep = steps[stepIdx] ?? null;
  const nextStep = steps[stepIdx + 1] ?? null;

  // Tự đọc hướng dẫn tiếng Việt mỗi khi sang bước rẽ mới lúc đang dẫn đường
  useEffect(() => {
    if (!navigating || !voiceEnabled || !currentStep) return;
    const key = `${detourStop?.placeId ?? 'main'}:${selectedRouteIndex}:${stepIdx}:${currentStep.instruction}`;
    if (lastSpokenKeyRef.current === key) return;
    lastSpokenKeyRef.current = key;
    const text = buildStepSpeech(currentStep);
    if (text) speakNavigation(text);
  }, [currentStep, detourStop?.placeId, navigating, selectedRouteIndex, stepIdx, voiceEnabled]);

  const distanceLabel = activeRoute
    ? (activeRoute.distanceText ?? formatDistance(activeRoute.distanceMeters))
    : null;
  const durationLabel = activeRoute
    ? (activeRoute.durationText ?? formatDurationSeconds(activeRoute.durationSeconds))
    : null;
  const etaLabel = activeRoute ? formatEta(activeRoute.durationSeconds) : null;

  const handleMarkerSelect = (id: string) => {
    if (!id.startsWith('gas:')) return;
    const targetId = id.slice(4);
    const found = gasStations.find((s) => s.placeId === targetId);
    if (found) void selectGasStation(found);
  };

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
                  {route?.distanceText ?? (route ? formatDistance(route.distanceMeters) : '')} ·{' '}
                  {route?.durationText ??
                    (route ? formatDurationSeconds(route.durationSeconds) : '')}
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
          points={inlinePoints}
          activeId={String(placeId)}
          route={mainRouteCoords}
          userLocation={userLocation}
        />
      </View>

      <View className="mt-3">
        <Button title="Mở Bản Đồ" icon="map" onPress={() => setExpanded(true)} />
      </View>

      {/* Modal phóng to bản đồ Goong: chế độ Xem trước hoặc Dẫn đường + ghé tạm cây xăng */}
      <Modal visible={expanded} animationType="slide" onRequestClose={() => setExpanded(false)}>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: navigating ? (detourStop ? '#C2410C' : '#0F6A5B') : '#FFFFFF',
          }}
        >
          {navigating ? (
            /* Banner dẫn đường trên cùng (xanh cho tuyến chính, cam đậm khi đang ghé cây xăng) */
            <View
              style={{ backgroundColor: detourStop ? '#C2410C' : '#0F6A5B' }}
              className="px-4 pb-3.5 pt-2"
            >
              {detourStop ? (
                <View className="mb-2 flex-row items-center gap-1.5">
                  <Icon name="local-gas-station" size={14} color="#FED7AA" />
                  <Text numberOfLines={1} className="flex-1 text-[12px] font-bold text-[#FFEDD5]">
                    Đang ghé tạm: {detourStop.name}
                  </Text>
                </View>
              ) : null}
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Icon name={maneuverIcon(currentStep?.maneuver)} size={30} color="#FFFFFF" />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[20px] font-extrabold text-white">
                    {currentStep
                      ? (currentStep.distanceText ?? formatDistance(currentStep.distanceMeters))
                      : distanceLabel}
                  </Text>
                  <Text
                    numberOfLines={2}
                    className="mt-0.5 text-[14px] font-semibold text-white/95"
                  >
                    {currentStep?.instruction ??
                      `Đi tới ${detourStop ? detourStop.name : placeName}`}
                  </Text>
                </View>
              </View>
              {nextStep ? (
                <View className="mt-2.5 flex-row items-center gap-1.5 rounded-xl bg-black/20 px-3 py-1.5">
                  <Text className="text-[11.5px] font-bold text-white/80">Sau đó:</Text>
                  <Icon name={maneuverIcon(nextStep.maneuver)} size={15} color="#FFFFFF" />
                  <Text numberOfLines={1} className="flex-1 text-[12px] font-semibold text-white">
                    {nextStep.instruction}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            /* Header xem trước tuyến (chọn Ô tô/Xe máy + Chỉ đường / Bắt đầu đi) */
            <>
              <View className="flex-row items-center justify-between gap-2 border-b border-[#E5ECEF] bg-white px-4 py-3">
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="text-[15.5px] font-extrabold text-[#13364A]">
                    {detourStop ? `${detourStop.name} (ghé tạm)` : placeName}
                  </Text>
                  {detourStop ? (
                    <Text numberOfLines={1} className="text-[12px] text-[#EA580C]">
                      Điểm chính: {placeName}
                    </Text>
                  ) : address ? (
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
                    const active = vehicle === item.value && Boolean(activeRoute);
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
                  title={loading ? 'Đang tìm...' : !route ? 'Chỉ đường' : 'Bắt đầu đi'}
                  icon={!route ? 'directions' : 'navigation'}
                  size="sm"
                  full={false}
                  loading={loading}
                  onPress={() => void (route ? toggleNavigation() : startDirections(vehicle))}
                />
              </View>
            </>
          )}

          {/* Thanh đổi cây xăng nhanh hoặc quay lại tuyến chính khi đang rẽ qua cây xăng */}
          {detourStop ? (
            <View className="flex-row items-center justify-between gap-2 border-b border-[#FED7AA] bg-[#FFF7ED] px-4 py-2.5">
              <View className="min-w-0 flex-1 flex-row items-center gap-2">
                <Icon name={arrivedAtDetour ? 'check-circle' : 'undo'} size={18} color="#C2410C" />
                <Text
                  numberOfLines={1}
                  className="flex-1 text-[12.5px] font-extrabold text-[#9A3412]"
                >
                  {arrivedAtDetour
                    ? `Đã tới · Tiếp tục đi ${placeName}`
                    : `Tuyến chính: ${placeName}`}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Pressable
                  onPress={() => void searchNearbyGas()}
                  disabled={loading}
                  className="rounded-full border border-[#FDBA74] bg-white px-2.5 py-1"
                >
                  <Text className="text-[11.5px] font-bold text-[#C2410C]">Đổi cây xăng</Text>
                </Pressable>
                <Pressable
                  onPress={() => void returnToMainRoute()}
                  disabled={loading}
                  className="rounded-full bg-[#EA580C] px-2.5 py-1"
                >
                  <Text className="text-[11.5px] font-bold text-white">Về tuyến chính</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* Khung bản đồ Goong + cụm nút nổi góc phải (Cây xăng, Về vị trí, Xem toàn tuyến) */}
          <View style={{ flex: 1, position: 'relative', backgroundColor: '#E8F3F5' }}>
            <PlacesMap
              ref={modalMapRef}
              points={modalPoints}
              activeId={detourStop ? `gas:${detourStop.placeId}` : String(placeId)}
              onSelect={handleMarkerSelect}
              route={activeRouteCoords}
              secondaryRoute={secondaryRouteCoords}
              routeOptions={routeOptionOverlays}
              onSelectRouteOption={(idx) => {
                setSelectedRouteIndex(idx);
                lastSpokenKeyRef.current = null;
                setShowRoutesPanel(false);
                setTimeout(() => modalMapRef.current?.fitAll(), 160);
              }}
              routeColor={detourStop ? DETOUR_COLOR : colors.primary}
              userLocation={userLocation}
              followUser={navigating && !cameraPaused && !showGasPanel}
              satellite={satellite}
              fitBottomPadding={120}
              disableAutoFit={showGasPanel}
              showCompass
              onUserInteract={() => {
                if (navigating && !cameraPausedRef.current) {
                  pauseCamera();
                }
              }}
            />

            {/* Nút nổi góc dưới trái: chuyển nhanh giữa Toàn tuyến ↔ Tiếp tục bám theo lúc đang đi */}
            {navigating ? (
              <View className="absolute bottom-4 left-3">
                {cameraPaused ? (
                  <Pressable
                    onPress={() => resumeCamera()}
                    style={shadow.raised}
                    className="flex-row items-center gap-1.5 rounded-full bg-[#0F6A5B] px-3.5 py-2.5"
                  >
                    <Icon name="my-location" size={18} color="#FFFFFF" />
                    <Text className="text-[12.5px] font-extrabold text-white">
                      Tiếp tục bám theo
                    </Text>
                  </Pressable>
                ) : activeRoute ? (
                  <Pressable
                    onPress={() => {
                      pauseCamera();
                      modalMapRef.current?.fitAll();
                    }}
                    style={shadow.raised}
                    className="flex-row items-center gap-1.5 rounded-full bg-white px-3.5 py-2.5"
                  >
                    <Icon name="zoom-out-map" size={18} color="#13364A" />
                    <Text className="text-[12.5px] font-extrabold text-[#13364A]">Toàn tuyến</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <View className="absolute bottom-4 right-3 gap-2.5">
              {/* Nút bật/tắt giọng đọc tiếng Việt khi đang dẫn đường */}
              {navigating ? (
                <Pressable
                  onPress={() => {
                    setVoiceEnabled((prev) => {
                      const next = !prev;
                      if (!next) {
                        stopNavigationSpeech();
                      } else if (currentStep) {
                        const text = buildStepSpeech(currentStep);
                        if (text) speakNavigation(text);
                      }
                      return next;
                    });
                  }}
                  accessibilityLabel={
                    voiceEnabled ? 'Tắt giọng đọc chỉ đường' : 'Bật giọng đọc chỉ đường'
                  }
                  style={[shadow.raised, { backgroundColor: voiceEnabled ? '#0F6A5B' : '#FFFFFF' }]}
                  className="h-11 w-11 items-center justify-center rounded-full"
                >
                  <Icon
                    name={voiceEnabled ? 'volume-up' : 'volume-off'}
                    size={22}
                    color={voiceEnabled ? '#FFFFFF' : '#64748B'}
                  />
                </Pressable>
              ) : null}

              {/* Nút chọn tuyến đường thay thế (khi Goong trả về ≥ 2 tuyến) */}
              {!detourStop && allMainRoutes.length > 1 ? (
                <Pressable
                  onPress={() => {
                    setShowGasPanel(false);
                    setShowStepsInNav(false);
                    setShowRoutesPanel((v) => {
                      const next = !v;
                      if (next && navigating) {
                        pauseCamera();
                        setTimeout(() => modalMapRef.current?.fitAll(), 150);
                      }
                      return next;
                    });
                  }}
                  accessibilityLabel="Chọn tuyến đường khác"
                  style={[
                    shadow.raised,
                    { backgroundColor: showRoutesPanel ? colors.primary : '#FFFFFF' },
                  ]}
                  className="h-11 w-11 items-center justify-center rounded-full"
                >
                  <Icon
                    name="alt-route"
                    size={22}
                    color={showRoutesPanel ? '#FFFFFF' : colors.primary}
                  />
                </Pressable>
              ) : null}

              {/* Nút đổi lớp bản đồ Mặc định ↔ Ảnh vệ tinh */}
              <Pressable
                onPress={() => setSatellite((v) => !v)}
                accessibilityLabel={
                  satellite ? 'Chuyển sang bản đồ mặc định' : 'Chuyển sang ảnh vệ tinh'
                }
                style={[shadow.raised, { backgroundColor: satellite ? colors.primary : '#FFFFFF' }]}
                className="h-11 w-11 items-center justify-center rounded-full"
              >
                <Icon name="layers" size={22} color={satellite ? '#FFFFFF' : '#13364A'} />
              </Pressable>

              {/* Nút tìm cây xăng gần vị trí hiện tại */}
              <Pressable
                onPress={() => void searchNearbyGas()}
                accessibilityLabel="Tìm cây xăng gần đây"
                style={[
                  shadow.raised,
                  { backgroundColor: showGasPanel || detourStop ? DETOUR_COLOR : '#FFFFFF' },
                ]}
                className="h-11 w-11 items-center justify-center rounded-full"
              >
                <Icon
                  name="local-gas-station"
                  size={22}
                  color={showGasPanel || detourStop ? '#FFFFFF' : DETOUR_COLOR}
                />
              </Pressable>

              {userLocation ? (
                <Pressable
                  onPress={() => {
                    if (navigating) {
                      resumeCamera();
                    } else {
                      modalMapRef.current?.focus(
                        userLocation.latitude,
                        userLocation.longitude,
                        0.004,
                      );
                    }
                  }}
                  accessibilityLabel="Về vị trí của tôi"
                  style={shadow.raised}
                  className="h-11 w-11 items-center justify-center rounded-full bg-white"
                >
                  <Icon name="my-location" size={22} color={colors.primary} />
                </Pressable>
              ) : null}

              {activeRoute ? (
                <Pressable
                  onPress={() => {
                    if (navigating) pauseCamera();
                    modalMapRef.current?.fitAll();
                  }}
                  accessibilityLabel="Xem toàn tuyến"
                  style={shadow.raised}
                  className="h-11 w-11 items-center justify-center rounded-full bg-white"
                >
                  <Icon name="zoom-out-map" size={22} color="#13364A" />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Khay trượt ngang chọn tuyến đường thay thế (giống Google Maps) */}
          {showRoutesPanel && !detourStop && allMainRoutes.length > 1 ? (
            <FadeInView offset={16} duration={220}>
              <View className="border-t border-[#CBE7EE] bg-[#F4FBFD] px-4 py-3">
                <View className="mb-2 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <Icon name="alt-route" size={18} color={colors.primary} />
                    <Text className="text-[13.5px] font-extrabold text-[#13364A]">
                      Chọn tuyến đường ({allMainRoutes.length} tuyến)
                    </Text>
                  </View>
                  <Pressable onPress={() => setShowRoutesPanel(false)} hitSlop={8}>
                    <Icon name="close" size={19} color="#64748B" />
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10 }}
                >
                  {allMainRoutes.map((option, idx) => {
                    const selected = idx === selectedRouteIndex;
                    const diffMin = Math.round(
                      (option.durationSeconds - allMainRoutes[0].durationSeconds) / 60,
                    );
                    return (
                      <Pressable
                        key={idx}
                        onPress={() => {
                          setSelectedRouteIndex(idx);
                          lastSpokenKeyRef.current = null;
                          setShowRoutesPanel(false);
                          setTimeout(() => modalMapRef.current?.fitAll(), 180);
                        }}
                        style={{ width: 195 }}
                        className={`rounded-2xl border p-3 ${
                          selected ? 'border-[#0891B2] bg-[#E7F8FA]' : 'border-[#DCEBEF] bg-white'
                        }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <Text className="text-[12px] font-bold text-[#0E7490]">
                            {idx === 0 ? 'Tuyến nhanh nhất' : `Tuyến ${idx + 1}`}
                          </Text>
                          {selected ? (
                            <Icon name="check-circle" size={16} color={colors.primary} />
                          ) : null}
                        </View>
                        <Text className="mt-1 text-[15px] font-extrabold text-[#13364A]">
                          {option.durationText ?? formatDurationSeconds(option.durationSeconds)}
                        </Text>
                        <Text className="mt-0.5 text-[12px] text-[#5C6E7E]">
                          {option.distanceText ?? formatDistance(option.distanceMeters)}
                          {idx > 0 && diffMin !== 0
                            ? ` (${diffMin > 0 ? `+${diffMin}` : diffMin} phút)`
                            : ''}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </FadeInView>
          ) : null}

          {/* Khay trượt ngang chọn cây xăng gần vị trí hiện tại */}
          {showGasPanel ? (
            <FadeInView offset={16} duration={220}>
              <View className="border-t border-[#FED7AA] bg-[#FFFBF7] px-4 py-3">
                <View className="mb-2 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <Icon name="local-gas-station" size={18} color={DETOUR_COLOR} />
                    <Text className="text-[13.5px] font-extrabold text-[#9A3412]">
                      Cây xăng gần bạn (≤ 5 km)
                    </Text>
                  </View>
                  <Pressable onPress={() => setShowGasPanel(false)} hitSlop={8}>
                    <Icon name="close" size={19} color="#64748B" />
                  </Pressable>
                </View>

                {gasLoading ? (
                  <View className="flex-row items-center gap-2 py-3">
                    <ActivityIndicator size="small" color={DETOUR_COLOR} />
                    <Text className="text-[12.5px] text-[#72818C]">
                      Đang tìm cây xăng gần vị trí của bạn...
                    </Text>
                  </View>
                ) : gasError ? (
                  <Text className="py-2 text-[12.5px] text-[#B91C1C]">{gasError}</Text>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10 }}
                  >
                    {gasStations.map((station) => {
                      const selected = detourStop?.placeId === station.placeId;
                      return (
                        <View
                          key={station.placeId}
                          style={{ width: 220 }}
                          className={`rounded-2xl border p-3 ${
                            selected ? 'border-[#EA580C] bg-[#FFF7ED]' : 'border-[#FED7AA] bg-white'
                          }`}
                        >
                          <Text
                            numberOfLines={1}
                            className="text-[13.5px] font-extrabold text-[#13364A]"
                          >
                            {station.name}
                          </Text>
                          <Text numberOfLines={2} className="mt-0.5 text-[11.5px] text-[#72818C]">
                            {station.address}
                          </Text>
                          <View className="mt-2.5 flex-row items-center justify-between">
                            <Text className="text-[12px] font-bold text-[#EA580C]">
                              Cách {formatDistance(station.distanceMeters)}
                            </Text>
                            {selected ? (
                              <View className="rounded-full bg-[#FFEDD5] px-2.5 py-1">
                                <Text className="text-[11.5px] font-bold text-[#C2410C]">
                                  Đang chọn
                                </Text>
                              </View>
                            ) : (
                              <Pressable
                                disabled={loading}
                                onPress={() => void selectGasStation(station)}
                                className="rounded-full bg-[#EA580C] px-3 py-1"
                              >
                                <Text className="text-[11.5px] font-bold text-white">
                                  {detourStop ? 'Đổi sang' : 'Rẽ qua'}
                                </Text>
                              </Pressable>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </FadeInView>
          ) : null}

          {/* Thanh dưới cùng khi đang Dẫn đường (giống Google Maps) */}
          {navigating ? (
            <View className="border-t border-[#E5ECEF] bg-white">
              {showStepsInNav && steps.length > 0 ? (
                <ScrollView
                  style={{ maxHeight: 220 }}
                  className="border-b border-[#EEF1F4]"
                  contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
                >
                  {steps.map((step, idx) => (
                    <View
                      key={idx}
                      className={`flex-row items-start gap-2.5 py-2 ${idx > 0 ? 'border-t border-[#EEF1F4]' : ''}`}
                    >
                      <View
                        className="mt-0.5 h-6 w-6 items-center justify-center rounded-full"
                        style={{
                          backgroundColor:
                            idx === stepIdx
                              ? detourStop
                                ? DETOUR_COLOR
                                : colors.primary
                              : '#E7F8FA',
                        }}
                      >
                        <Icon
                          name={maneuverIcon(step.maneuver)}
                          size={14}
                          color={idx === stepIdx ? '#FFFFFF' : colors.primary}
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-[13px] leading-[18px] ${
                            idx === stepIdx
                              ? detourStop
                                ? 'font-extrabold text-[#C2410C]'
                                : 'font-extrabold text-[#0F6A5B]'
                              : 'text-[#13364A]'
                          }`}
                        >
                          {step.instruction}
                        </Text>
                        <Text className="mt-0.5 text-[11px] text-[#72818C]">
                          {step.distanceText ?? formatDistance(step.distanceMeters)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : null}

              <View className="flex-row items-center justify-between gap-3 px-4 py-3.5">
                <View className="min-w-0 flex-1">
                  <Text
                    style={{ color: detourStop ? '#C2410C' : '#0F6A5B' }}
                    className="text-[20px] font-extrabold"
                  >
                    {durationLabel}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="mt-0.5 text-[13px] font-semibold text-[#5C6E7E]"
                  >
                    {distanceLabel}
                    {etaLabel ? ` · Đến lúc ${etaLabel}` : ''}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  {steps.length > 0 ? (
                    <Pressable
                      onPress={() => {
                        setShowGasPanel(false);
                        setShowStepsInNav((v) => !v);
                      }}
                      accessibilityLabel="Xem các bước rẽ"
                      className="h-11 w-11 items-center justify-center rounded-full"
                      style={{ backgroundColor: showStepsInNav ? '#E7F8FA' : '#F1F5F8' }}
                    >
                      <Icon
                        name="format-list-bulleted"
                        size={22}
                        color={showStepsInNav ? colors.primary : '#334E68'}
                      />
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => void toggleNavigation()}
                    className="h-11 flex-row items-center gap-1.5 rounded-full bg-[#DC2626] px-4"
                  >
                    <Icon name="close" size={18} color="#FFFFFF" />
                    <Text className="text-[13.5px] font-extrabold text-white">Thoát</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : activeRoute || error ? (
            /* Bảng xem trước tuyến khi chưa bấm Bắt đầu đi */
            <View style={{ maxHeight: '34%' }} className="border-t border-[#E5ECEF] bg-white">
              {error ? (
                <Text className="p-4 text-[13px] text-[#B91C1C]">{error}</Text>
              ) : (
                <>
                  <View className="border-b border-[#EEF1F4] px-4 py-2.5">
                    <Text className="text-[11px] font-bold uppercase text-[#72818C]">
                      {detourStop ? `Tuyến tới ${detourStop.name}` : 'Tuyến đường Goong Maps'}
                    </Text>
                    <Text className="mt-0.5 text-[15px] font-extrabold text-[#13364A]">
                      {distanceLabel} · {durationLabel}
                      {etaLabel ? ` (đến lúc ${etaLabel})` : ''}
                    </Text>
                  </View>
                  <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                    {steps.length > 0 ? (
                      steps.map((step, idx) => (
                        <View
                          key={idx}
                          className={`flex-row items-start gap-2.5 py-2 ${idx > 0 ? 'border-t border-[#EEF1F4]' : ''}`}
                        >
                          <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-[#E7F8FA]">
                            <Icon
                              name={maneuverIcon(step.maneuver)}
                              size={14}
                              color={colors.primary}
                            />
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
