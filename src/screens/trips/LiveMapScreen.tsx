import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage } from '../../api/http';
import { mapsApi, type NearbyPlace } from '../../api/mapsApi';
import {
  tripFlowApi,
  type GoongRoute,
  type GoongVehicle,
  type ItineraryOverview,
  type NextTripRoute,
  type TripProgressResponse,
} from '../../api/tripFlowApi';
import PlacesMap, {
  hasCoordinate,
  type PlacesMapHandle,
  type RouteOptionOverlay,
} from '../../components/PlacesMap';
import ReviewForm from '../../components/ReviewForm';
import TodayWeatherCard from '../../components/TodayWeatherCard';
import type { RootScreenProps } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { Button, IconButton } from '../../ui/Button';
import { Icon, type IconName } from '../../ui/Icon';
import { AnimatedProgressBar, FadeInView, ListCardSkeleton } from '../../ui/Motion';
import { ErrorState, Notice } from '../../ui/States';
import { Toast, useToast } from '../../ui/Toast';
import { formatTime } from '../../utils/format';
import { setNavigationLockScreen } from '../../utils/lockScreen';
import { speakNavigation, stopNavigationSpeech } from '../../utils/voiceGuidance';
import { formatMeters, formatSeconds, type Coordinate } from '../../utils/navGeo';
import { useGpsTracker } from '../../utils/useGpsTracker';
import { decodePolyline, toLatLng, useNavigationGuidance } from '../../utils/useNavigationGuidance';

type LatLng = { latitude: number; longitude: number };

/** Màu tuyến và nhãn khi ghé tạm cây xăng */
const DETOUR_COLOR = '#EA580C';

const VEHICLES: { value: GoongVehicle; label: string }[] = [
  { value: 'car', label: 'Ô tô' },
  { value: 'bike', label: 'Xe máy' },
];

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
  // Chế độ dẫn đường toàn màn hình kiểu Google Maps
  const [navMode, setNavMode] = useState(false);
  const [following, setFollowing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  // Lớp bản đồ và giọng đọc: giữ nguyên xuyên suốt cả ngày (không reset khi sang điểm tiếp theo)
  const [satellite, setSatellite] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  // Tuyến thay thế của chặng hiện tại (0 = tuyến chính Goong đề xuất)
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [showRoutesPanel, setShowRoutesPanel] = useState(false);
  // Ghé tạm cây xăng (detour): tuyến tới cây xăng thay tuyến chính cho tới khi quay lại
  const [gasStations, setGasStations] = useState<NearbyPlace[]>([]);
  const [gasLoading, setGasLoading] = useState(false);
  const [gasError, setGasError] = useState<string | null>(null);
  const [showGasPanel, setShowGasPanel] = useState(false);
  const [detourStop, setDetourStop] = useState<NearbyPlace | null>(null);
  const [detourRoute, setDetourRoute] = useState<GoongRoute | null>(null);
  const [detourLoading, setDetourLoading] = useState(false);
  const lastSpokenRef = useRef<string | null>(null);
  const legAnnouncedRef = useRef<string | null>(null);
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
  const onRouteRef = useRef(false);

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

  // GPS đã lọc vị trí xấu (ngoài Việt Nam, sai số lớn, nhảy bất thường)
  const tracker = useGpsTracker(isRunning);
  const { fix } = tracker;
  const location = useMemo(
    () =>
      fix
        ? { latitude: fix.coordinate[0], longitude: fix.coordinate[1], accuracy: fix.accuracy }
        : null,
    [fix],
  );

  // Gọi Goong Directions qua Backend: đổi điểm đến/phương tiện thì tính lại; GPS thay đổi thì giới hạn tần suất
  useEffect(() => {
    if (!isRunning || !pendingStop || !location) {
      setRoute(null);
      setRouteError(null);
      lastRequest.current = null;
      return;
    }
    const now = Date.now();
    // Đang rẽ tạm cây xăng: khóa tự tính lại tuyến chính để không ghi đè tuyến cây xăng
    if (detourStop) return;
    const last = lastRequest.current;
    if (last && last.itemId === pendingStop.itemId && last.vehicle === vehicle) {
      // Đang đi đúng tuyến: không cần hỏi Goong lại
      if (onRouteRef.current) return;
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
        if (sequence.current !== requestId) return;
        setRoute(response);
        setSelectedRouteIndex(0);
      })
      .catch((error: unknown) => {
        if (sequence.current !== requestId) return;
        setRouteError(errorMessage(error));
        setRoute(null);
      })
      .finally(() => {
        if (sequence.current === requestId) setRouteLoading(false);
      });
  }, [
    isRunning,
    pendingStop?.itemId,
    location,
    vehicle,
    planId,
    dayNumber,
    rerouteVersion,
    detourStop,
  ]);

  const routeForStop = route && pendingStop && route.itemId === pendingStop.itemId ? route : null;

  // Tuyến chính + các tuyến thay thế Goong trả về cho chặng hiện tại (next-route)
  const allMainRoutes = useMemo<GoongRoute[]>(
    () => (routeForStop ? [routeForStop.route, ...(routeForStop.route.alternatives ?? [])] : []),
    [routeForStop],
  );
  const selectedMainRoute = allMainRoutes[selectedRouteIndex] ?? routeForStop?.route ?? null;
  // Tuyến đang dẫn: tuyến tới cây xăng khi ghé tạm, ngược lại là tuyến tới điểm dừng hiện tại
  const activeRoute: GoongRoute | null =
    detourStop && detourRoute ? detourRoute : selectedMainRoute;

  /** Tính tuyến từ vị trí hiện tại tới cây xăng; refit = căn bản đồ vừa tuyến và tạm dừng bám camera */
  const fetchDetourRoute = async (
    origin: Coordinate,
    station: NearbyPlace,
    mode: GoongVehicle,
    refit: boolean,
  ) => {
    setDetourLoading(true);
    try {
      const result = await mapsApi.directions({
        fromLat: origin[0],
        fromLng: origin[1],
        toLat: station.latitude,
        toLng: station.longitude,
        vehicle: mode,
      });
      setDetourStop(station);
      setDetourRoute(result);
      setShowGasPanel(false);
      setShowRoutesPanel(false);
      lastSpokenRef.current = null;
      if (refit) {
        setFollowing(false);
        setTimeout(() => mapRef.current?.fitAll(), 180);
      }
    } catch (error) {
      showToast(errorMessage(error));
    } finally {
      setDetourLoading(false);
    }
  };

  const destination = useMemo(
    () =>
      detourStop
        ? {
            name: detourStop.name,
            coordinate: [detourStop.latitude, detourStop.longitude] as Coordinate,
          }
        : pendingStop && hasCoordinate(pendingStop)
          ? {
              name: pendingStop.placeName,
              coordinate: [pendingStop.latitude, pendingStop.longitude] as Coordinate,
            }
          : null,
    [detourStop, pendingStop],
  );
  const nav = useNavigationGuidance({
    route: activeRoute,
    fix,
    destination,
    loading: routeLoading || detourLoading,
    active: isRunning && Boolean(pendingStop),
    onOffRoute: () => {
      // Đang rẽ cây xăng: tính lại tuyến tới cây xăng (tuyến chính đang bị khóa)
      if (detourStop && fix) {
        void fetchDetourRoute(fix.coordinate, detourStop, vehicle, false);
        return;
      }
      lastRequest.current = null;
      setRerouteVersion((v) => v + 1);
    },
  });
  onRouteRef.current = nav.onRoute;

  /** Mở/đóng danh sách cây xăng gần; dùng lại danh sách đã tải (cache) để mở tức thì */
  const searchNearbyGas = async () => {
    if (showGasPanel) {
      setShowGasPanel(false);
      return;
    }
    setShowRoutesPanel(false);
    setShowGasPanel(true);
    if (gasStations.length > 0) {
      setGasError(null);
      return;
    }
    const origin = fix?.coordinate;
    if (!origin) {
      setGasError('Chưa có vị trí GPS để tìm cây xăng gần bạn.');
      return;
    }
    setGasLoading(true);
    setGasError(null);
    try {
      const found = await mapsApi.nearby({
        lat: origin[0],
        lng: origin[1],
        keyword: 'cây xăng',
        radius: 5,
      });
      setGasStations(found);
      if (found.length === 0) setGasError('Không tìm thấy cây xăng nào trong bán kính 5 km.');
    } catch (error) {
      setGasError(errorMessage(error));
    } finally {
      setGasLoading(false);
    }
  };

  const selectGasStation = (station: NearbyPlace) => {
    const origin = fix?.coordinate;
    if (!origin) {
      showToast('Chưa có vị trí GPS để chỉ đường tới cây xăng.');
      return;
    }
    void fetchDetourRoute(origin, station, vehicle, true);
  };

  /** Bỏ rẽ tạm: quay lại dẫn đường tới điểm dừng hiện tại và mở lại tự tính tuyến (next-route) */
  const returnToMainRoute = () => {
    setDetourStop(null);
    setDetourRoute(null);
    setShowGasPanel(false);
    setGasStations([]);
    lastSpokenRef.current = null;
    lastRequest.current = null;
    setRerouteVersion((v) => v + 1);
    if (navMode) setFollowing(true);
  };

  const chooseAlternativeRoute = (index: number) => {
    setSelectedRouteIndex(index);
    setShowRoutesPanel(false);
    lastSpokenRef.current = null;
    setFollowing(false);
    setTimeout(() => mapRef.current?.fitAll(), 150);
  };

  const toggleRoutesPanel = () => {
    setShowGasPanel(false);
    if (!showRoutesPanel && navMode) {
      setFollowing(false);
      setTimeout(() => mapRef.current?.fitAll(), 150);
    }
    setShowRoutesPanel((open) => !open);
  };

  // Đổi phương tiện khi đang rẽ cây xăng: tính lại tuyến tới cây xăng (tuyến chính bị khóa)
  useEffect(() => {
    if (detourStop && fix) void fetchDetourRoute(fix.coordinate, detourStop, vehicle, false);
  }, [vehicle]);

  // Sang điểm dừng tiếp theo (hoặc hết điểm): bỏ rẽ tạm, trả tuyến thay thế về 0, xóa cache cây xăng
  useEffect(() => {
    setSelectedRouteIndex(0);
    setShowRoutesPanel(false);
    setDetourStop(null);
    setDetourRoute(null);
    setGasStations([]);
    setGasError(null);
    setShowGasPanel(false);
    lastSpokenRef.current = null;
  }, [pendingStop?.itemId]);

  // Giọng đọc chỉ đường tiếng Việt theo tuyến đang dẫn (tới điểm dừng hoặc tới cây xăng)
  useEffect(() => {
    if (!navMode || !voiceEnabled || !isRunning || !nav.guidance || !pendingStop) return;
    const stopKey = detourStop ? `gas:${detourStop.placeId}` : `stop:${pendingStop.itemId}`;
    const key = `${stopKey}:${selectedRouteIndex}:${nav.guidance.icon}:${nav.guidance.text}`;
    if (lastSpokenRef.current === key) return;
    lastSpokenRef.current = key;
    // Vừa chuyển sang chặng mới: đọc thông báo chuyển chặng
    const newLeg =
      legAnnouncedRef.current !== null && legAnnouncedRef.current !== stopKey && !detourStop;
    legAnnouncedRef.current = stopKey;
    const spoken = (value: string) =>
      value.replace(/(\d)\s*km\b/g, '$1 ki lô mét').replace(/(\d)\s*m\b/g, '$1 mét');
    const line = `${spoken(nav.guidance.title)}, ${nav.guidance.text}`;
    speakNavigation(newLeg ? `Tiếp tục đi tới ${pendingStop.placeName}. ${line}` : line);
  }, [navMode, voiceEnabled, isRunning, nav.guidance, pendingStop, detourStop, selectedRouteIndex]);

  // Tắt loa / thoát dẫn đường / rời màn hình thì dừng đọc ngay
  useEffect(() => {
    if (!navMode || !voiceEnabled) {
      stopNavigationSpeech();
      lastSpokenRef.current = null;
    }
  }, [navMode, voiceEnabled]);
  useEffect(() => () => stopNavigationSpeech(), []);

  // Khi mở khay cây xăng và đã có danh sách → tạm dừng bám GPS & zoom cận vừa khít các cây xăng quanh bạn
  useEffect(() => {
    if (!showGasPanel || gasStations.length === 0) return;
    setFollowing(false);
    const targets: LatLng[] = gasStations.map((s) => ({
      latitude: s.latitude,
      longitude: s.longitude,
    }));
    if (location) targets.push({ latitude: location.latitude, longitude: location.longitude });
    const timer = setTimeout(() => mapRef.current?.fitPoints(targets), 380);
    return () => clearTimeout(timer);
  }, [gasStations, location, showGasPanel]);

  // Danh sách toàn bộ tuyến (đang chọn + thay thế) kèm nhãn thời gian vẽ trực tiếp trên bản đồ giống Google Maps
  const routeOptionOverlays = useMemo<RouteOptionOverlay[] | undefined>(() => {
    if (detourStop || allMainRoutes.length < 2) return undefined;
    if (navMode && following && !showRoutesPanel) return undefined;
    return allMainRoutes.map((option, idx) => {
      const diffMin = Math.round((option.durationSeconds - allMainRoutes[0].durationSeconds) / 60);
      return {
        index: idx,
        coordinates: option.polyline ? decodePolyline(option.polyline).map(toLatLng) : [],
        durationLabel: option.durationText ?? formatDurationSeconds(option.durationSeconds),
        distanceLabel: option.distanceText ?? formatDistance(option.distanceMeters),
        diffLabel:
          idx > 0 && diffMin !== 0 ? `${diffMin > 0 ? `+${diffMin}` : diffMin}p` : undefined,
        selected: idx === selectedRouteIndex,
      };
    });
  }, [allMainRoutes, detourStop, following, navMode, selectedRouteIndex, showRoutesPanel]);

  const mainLine = useMemo(
    () =>
      selectedMainRoute?.polyline ? decodePolyline(selectedMainRoute.polyline).map(toLatLng) : [],
    [selectedMainRoute],
  );
  const gasPoints = (detourStop ? [detourStop] : showGasPanel ? gasStations : []).map(
    (station) => ({
      id: `gas:${station.placeId}`,
      latitude: station.latitude,
      longitude: station.longitude,
      label: '⛽',
      title: station.name,
      color: DETOUR_COLOR,
    }),
  );
  const todoLine = useMemo(() => nav.parts.todo.map(toLatLng), [nav.parts.todo]);
  const doneLine = useMemo(() => nav.parts.done.map(toLatLng), [nav.parts.done]);
  const userMarker = useMemo(
    () => (nav.displayLocation ? toLatLng(nav.displayLocation) : null),
    [nav.displayLocation],
  );

  const startNavigation = () => {
    setNavMode(true);
    setFollowing(true);
    setSheetOpen(false);
    setPicking(false);
  };
  const stopNavigation = () => {
    setNavMode(false);
    setFollowing(false);
    setSheetOpen(false);
  };
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

  const displayPoints = [...mapPoints, ...gasPoints];

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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
        <ListCardSkeleton count={4} />
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

  const navSeconds = nav.remaining?.seconds ?? activeRoute?.durationSeconds ?? null;
  const navMeters = nav.remaining?.meters ?? activeRoute?.distanceMeters ?? null;
  const navEta =
    navSeconds !== null
      ? (() => {
          const arrival = new Date(Date.now() + navSeconds * 1000);
          return `${String(arrival.getHours()).padStart(2, '0')}:${String(arrival.getMinutes()).padStart(2, '0')}`;
        })()
      : null;
  const navSteps = activeRoute?.steps ?? [];
  const nextNavStep = navSteps.length > 1 ? navSteps[1] : null;
  const bannerBg = detourStop
    ? '#C2410C'
    : nav.guidance?.icon === 'alt-route'
      ? '#B45309'
      : '#0F6A5B';

  return (
    <SafeAreaView
      edges={navMode ? ['top', 'bottom'] : []}
      style={{ flex: 1, backgroundColor: navMode ? bannerBg : colors.bg }}
    >
      {/* Banner dẫn đường tràn viền trên cùng giống PlaceDirectionsMap khi đang navMode */}
      {navMode ? (
        <View style={{ backgroundColor: bannerBg }} className="px-4 pb-3.5 pt-2">
          <View className="mb-1.5 flex-row items-center justify-between gap-2">
            <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
              {detourStop ? (
                <Icon name="local-gas-station" size={14} color="#FED7AA" />
              ) : (
                <Icon name="flag" size={13} color="#A7F3D0" />
              )}
              <Text
                numberOfLines={1}
                className="flex-1 text-[12px] font-bold"
                style={{ color: detourStop ? '#FFEDD5' : '#D1FAE5' }}
              >
                {detourStop
                  ? `Đang ghé tạm: ${detourStop.name}`
                  : `Ngày ${dayNumber} · ${completedCount}/${stops.length} điểm · ${pendingStop?.placeName ?? ''}`}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Icon
                name={(nav.guidance?.icon as IconName) ?? 'navigation'}
                size={30}
                color="#FFFFFF"
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[20px] font-extrabold text-white">
                {nav.guidance?.title ??
                  (navMeters !== null ? formatMeters(navMeters) : 'Đang tính đường...')}
              </Text>
              <Text numberOfLines={2} className="mt-0.5 text-[14px] font-semibold text-white/95">
                {nav.guidance?.text ??
                  `Đi tới ${detourStop ? detourStop.name : (pendingStop?.placeName ?? 'điểm tiếp theo')}`}
              </Text>
            </View>
          </View>

          {nextNavStep && nav.guidance?.icon !== 'alt-route' ? (
            <View className="mt-2.5 flex-row items-center gap-1.5 rounded-xl bg-black/20 px-3 py-1.5">
              <Text className="text-[11.5px] font-bold text-white/80">Sau đó:</Text>
              <Icon name="straight" size={15} color="#FFFFFF" />
              <Text numberOfLines={1} className="flex-1 text-[12px] font-semibold text-white">
                {nextNavStep.instruction}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Thanh cam đổi cây xăng nhanh hoặc quay lại tuyến chính ngay dưới banner (giống PlaceDirectionsMap) */}
      {detourStop && navMode ? (
        <View className="flex-row items-center justify-between gap-2 border-b border-[#FED7AA] bg-[#FFF7ED] px-4 py-2.5">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <Icon name="undo" size={18} color="#C2410C" />
            <Text numberOfLines={1} className="flex-1 text-[12.5px] font-extrabold text-[#9A3412]">
              Tuyến chính: {pendingStop?.placeName ?? 'điểm dừng'}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={() => {
                setShowRoutesPanel(false);
                setShowGasPanel((v) => !v);
              }}
              className="rounded-full border border-[#FDBA74] bg-white px-2.5 py-1"
            >
              <Text className="text-[11.5px] font-bold text-[#C2410C]">Đổi cây xăng</Text>
            </Pressable>
            <Pressable
              onPress={returnToMainRoute}
              className="rounded-full bg-[#EA580C] px-2.5 py-1"
            >
              <Text className="text-[11.5px] font-bold text-white">Về tuyến chính</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View
        style={
          navMode
            ? { flex: 1, position: 'relative', backgroundColor: '#E8F3F5', overflow: 'hidden' }
            : {
                height: '42%',
                position: 'relative',
                backgroundColor: '#E8F3F5',
                overflow: 'hidden',
              }
        }
      >
        <PlacesMap
          ref={mapRef}
          points={displayPoints}
          activeId={
            detourStop
              ? `gas:${detourStop.placeId}`
              : pendingStop
                ? String(pendingStop.itemId)
                : null
          }
          route={todoLine}
          doneRoute={doneLine}
          secondaryRoute={detourStop ? mainLine : undefined}
          routeOptions={routeOptionOverlays}
          onSelectRouteOption={chooseAlternativeRoute}
          routeColor={detourStop ? DETOUR_COLOR : undefined}
          satellite={satellite}
          fitBottomPadding={navMode ? 120 : undefined}
          disableAutoFit={showGasPanel}
          showCompass={navMode}
          onSelect={(id) => {
            if (!id.startsWith('gas:')) return;
            const station = gasStations.find((item) => item.placeId === id.slice(4));
            if (station) selectGasStation(station);
          }}
          userLocation={userMarker}
          userHeading={fix?.heading ?? null}
          userAccuracy={fix?.accuracy ?? null}
          followUser={navMode && following && !showGasPanel && !showRoutesPanel}
          onUserInteract={() => setFollowing(false)}
          onPick={
            picking
              ? (latitude, longitude) => {
                  tracker.setManual([latitude, longitude]);
                  setPicking(false);
                  lastRequest.current = null;
                  showToast('Đã dùng vị trí bạn chọn trên bản đồ để chỉ đường.');
                }
              : undefined
          }
        />

        {/* Header nổi trên bản đồ chỉ hiện khi ở chế độ xem tổng quan ngày (!navMode) */}
        {!navMode ? (
          <SafeAreaView
            edges={['top']}
            pointerEvents="box-none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
          >
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
                onPress={() => {
                  if (location) {
                    mapRef.current?.focus(location.latitude, location.longitude, 0.01);
                  } else {
                    tracker.retry();
                  }
                }}
              />
            </View>
            {picking ? (
              <View
                style={shadow.raised}
                className="mx-3 mt-2 flex-row items-center gap-3 rounded-2xl bg-[#13364A] px-4 py-3"
              >
                <Icon name="place" size={26} color="#FFFFFF" />
                <Text className="flex-1 text-[13px] font-bold leading-[18px] text-white">
                  Chạm lên bản đồ để chọn vị trí của bạn
                </Text>
                <Pressable
                  onPress={() => setPicking(false)}
                  className="rounded-full bg-white/20 px-3 py-1.5"
                >
                  <Text className="text-[11px] font-extrabold text-white">Hủy</Text>
                </Pressable>
              </View>
            ) : null}
          </SafeAreaView>
        ) : null}

        {/* Nút nổi góc dưới trái khi đang navMode: Toàn tuyến ↔ Tiếp tục bám theo (y hệt PlaceDirectionsMap) */}
        {navMode ? (
          <View className="absolute bottom-4 left-3">
            {!following ? (
              <Pressable
                onPress={() => {
                  setFollowing(true);
                  setShowGasPanel(false);
                  setShowRoutesPanel(false);
                  if (location) {
                    mapRef.current?.focus(location.latitude, location.longitude, 0.004);
                  }
                }}
                style={shadow.raised}
                className="flex-row items-center gap-1.5 rounded-full bg-[#0F6A5B] px-3.5 py-2.5"
              >
                <Icon name="my-location" size={18} color="#FFFFFF" />
                <Text className="text-[12.5px] font-extrabold text-white">Tiếp tục bám theo</Text>
              </Pressable>
            ) : activeRoute ? (
              <Pressable
                onPress={() => {
                  setFollowing(false);
                  mapRef.current?.fitAll();
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

        {/* Cụm nút nổi góc dưới phải khi đang navMode (đúng thứ tự & màu sắc như PlaceDirectionsMap) */}
        {navMode ? (
          <View className="absolute bottom-4 right-3 gap-2.5">
            <Pressable
              onPress={() => setVoiceEnabled((value) => !value)}
              accessibilityLabel={voiceEnabled ? 'Tắt giọng đọc' : 'Bật giọng đọc'}
              style={[shadow.raised, { backgroundColor: voiceEnabled ? '#0F6A5B' : '#FFFFFF' }]}
              className="h-11 w-11 items-center justify-center rounded-full"
            >
              <Icon
                name={voiceEnabled ? 'volume-up' : 'volume-off'}
                size={22}
                color={voiceEnabled ? '#FFFFFF' : '#64748B'}
              />
            </Pressable>

            {!detourStop && allMainRoutes.length > 1 ? (
              <Pressable
                onPress={toggleRoutesPanel}
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

            <Pressable
              onPress={() => setSatellite((value) => !value)}
              accessibilityLabel={satellite ? 'Bản đồ mặc định' : 'Ảnh vệ tinh'}
              style={[shadow.raised, { backgroundColor: satellite ? colors.primary : '#FFFFFF' }]}
              className="h-11 w-11 items-center justify-center rounded-full"
            >
              <Icon name="layers" size={22} color={satellite ? '#FFFFFF' : '#13364A'} />
            </Pressable>

            <Pressable
              onPress={() => void searchNearbyGas()}
              accessibilityLabel="Cây xăng gần"
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

            {location ? (
              <Pressable
                onPress={() => {
                  setFollowing(true);
                  mapRef.current?.focus(location.latitude, location.longitude, 0.004);
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
                  setFollowing(false);
                  mapRef.current?.fitAll();
                }}
                accessibilityLabel="Xem toàn tuyến"
                style={shadow.raised}
                className="h-11 w-11 items-center justify-center rounded-full bg-white"
              >
                <Icon name="zoom-out-map" size={22} color="#13364A" />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Khay trượt ngang chọn tuyến thay thế khi đang navMode */}
      {navMode && showRoutesPanel && !detourStop && allMainRoutes.length > 1 ? (
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
                    onPress={() => chooseAlternativeRoute(idx)}
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

      {/* Khay trượt ngang chọn cây xăng gần khi đang navMode */}
      {navMode && showGasPanel ? (
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
              <Text className="py-2 text-[12.5px] text-[#72818C]">
                Đang tìm cây xăng gần vị trí của bạn...
              </Text>
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
                          Cách {formatMeters(station.distanceMeters)}
                        </Text>
                        {selected ? (
                          <View className="rounded-full bg-[#FFEDD5] px-2.5 py-1">
                            <Text className="text-[11.5px] font-bold text-[#C2410C]">
                              Đang chọn
                            </Text>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => selectGasStation(station)}
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

      <ScrollView
        style={
          navMode
            ? {
                maxHeight: '45%',
                backgroundColor: colors.bg,
                borderTopWidth: 1,
                borderTopColor: '#E5ECEF',
                display: sheetOpen ? 'flex' : 'none',
              }
            : {
                flex: 1,
                backgroundColor: colors.bg,
                borderTopWidth: 1,
                borderTopColor: '#E5ECEF',
                zIndex: 2,
                elevation: 2,
              }
        }
        contentContainerStyle={{ padding: 16, paddingBottom: navMode ? 16 : 32 + insets.bottom }}
      >
        <View className="mb-3">
          <AnimatedProgressBar percent={percent} color={colors.success} />
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

        {isRunning && tracker.suspicious ? (
          <View className="mt-3 gap-2">
            <Notice tone="warning" title="Vị trí GPS có vẻ không đúng">
              {tracker.message} Hãy thử lại GPS hoặc chọn vị trí của bạn trên bản đồ.
            </Notice>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button title="Thử GPS lại" variant="outline" size="sm" onPress={tracker.retry} />
              </View>
              <View className="flex-1">
                <Button
                  title="Chọn vị trí của tôi"
                  icon="place"
                  size="sm"
                  onPress={() => {
                    setNavMode(false);
                    setPicking(true);
                  }}
                />
              </View>
            </View>
          </View>
        ) : isRunning && !location ? (
          <View className="mt-3 gap-2">
            <Text className="text-center text-[12px] text-[#72818C]">{tracker.message}</Text>
            <Button title="Thử lấy GPS lại" variant="outline" size="sm" onPress={tracker.retry} />
          </View>
        ) : null}

        {isRunning && tracker.manual ? (
          <View className="mt-3">
            <Notice tone="info">Đang dùng vị trí bạn chọn trên bản đồ.</Notice>
            <Button
              title="Dùng GPS thật"
              variant="outline"
              size="sm"
              onPress={tracker.clearManual}
            />
          </View>
        ) : null}

        {isRunning && pendingStop && location && !navMode ? (
          <View className="mt-3">
            <Button title="Bắt đầu dẫn đường" icon="navigation" onPress={startNavigation} />
          </View>
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
            {activeRoute ? (
              <View className="mt-3">
                {!detourStop && allMainRoutes.length > 1 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
                  >
                    {allMainRoutes.map((item, idx) => {
                      const active = idx === selectedRouteIndex;
                      const diffMin = Math.round(
                        (item.durationSeconds - allMainRoutes[0].durationSeconds) / 60,
                      );
                      return (
                        <Pressable
                          key={idx}
                          onPress={() => chooseAlternativeRoute(idx)}
                          className={`rounded-2xl border px-3 py-2 ${
                            active
                              ? 'border-[#0891B2] bg-[#ECFEFF]'
                              : 'border-[#E5ECEF] bg-[#F8FAFC]'
                          }`}
                        >
                          <Text
                            className={`text-[11px] font-bold ${
                              active ? 'text-[#0E7490]' : 'text-[#557080]'
                            }`}
                          >
                            {idx === 0 ? 'Tuyến nhanh nhất' : `Tuyến ${idx + 1}`}
                          </Text>
                          <Text className="mt-0.5 text-[13px] font-extrabold text-[#13364A]">
                            {item.durationText || formatDurationSeconds(item.durationSeconds)}
                          </Text>
                          <Text className="text-[11px] text-[#72818C]">
                            {item.distanceText || formatDistance(item.distanceMeters)}
                            {idx > 0 && diffMin > 0
                              ? ` (+${diffMin}p)`
                              : idx > 0 && diffMin < 0
                                ? ` (${diffMin}p)`
                                : ''}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : null}

                <View className="flex-row gap-3">
                  <View className="flex-1 rounded-2xl bg-[#ECFEFF] p-3">
                    <Text className="text-[11px] text-[#557080]">Còn lại</Text>
                    <Text className="text-[16px] font-extrabold text-[#0E7490]">
                      {nav.remaining
                        ? formatMeters(nav.remaining.meters)
                        : (activeRoute.distanceText ?? formatDistance(activeRoute.distanceMeters))}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-[#ECFEFF] p-3">
                    <Text className="text-[11px] text-[#557080]">Thời gian</Text>
                    <Text className="text-[16px] font-extrabold text-[#0E7490]">
                      {nav.remaining
                        ? formatSeconds(nav.remaining.seconds)
                        : (activeRoute.durationText ??
                          formatDurationSeconds(activeRoute.durationSeconds))}
                    </Text>
                  </View>
                </View>
                {route?.arrived || nav.arrived ? (
                  <View className="mt-2.5">
                    <Notice tone="success">
                      Bạn đã ở gần {route?.placeName ?? pendingStop.placeName}. Bấm “Đã đến” khi
                      tham quan xong.
                    </Notice>
                  </View>
                ) : null}
                {route?.lowAccuracy ? (
                  <View className="mt-2.5">
                    <Notice tone="warning">Sai số GPS lớn, vị trí chỉ mang tính tham khảo.</Notice>
                  </View>
                ) : null}
                {(activeRoute.steps ?? []).length > 0 ? (
                  <View className="mt-3 gap-2">
                    {(activeRoute.steps ?? []).slice(0, 6).map((step, index) => (
                      <View key={`${selectedRouteIndex}-${index}`} className="flex-row gap-2.5">
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

      {/* Thanh đáy khi đang navMode — đồng bộ y hệt Ảnh 1 (PlaceDirectionsMap) */}
      {navMode ? (
        <View className="border-t border-[#E5ECEF] bg-white px-4 py-3.5">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text
                numberOfLines={1}
                style={{ color: detourStop ? '#C2410C' : '#0F6A5B' }}
                className="text-[20px] font-extrabold"
              >
                {nav.arrived
                  ? 'Bạn đã đến nơi'
                  : navSeconds !== null
                    ? formatSeconds(navSeconds)
                    : pendingStop
                      ? routeLoading
                        ? 'Đang tính...'
                        : 'Chưa có tuyến'
                      : 'Xong hết điểm'}
              </Text>
              <Text numberOfLines={1} className="mt-0.5 text-[13px] font-semibold text-[#5C6E7E]">
                {navMeters !== null ? formatMeters(navMeters) : ''}
                {navEta ? ` · Đến lúc ${navEta}` : ''}
                {pendingStop && !detourStop ? ` · ${pendingStop.placeName}` : ''}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => {
                  setShowGasPanel(false);
                  setShowRoutesPanel(false);
                  setSheetOpen((open) => !open);
                }}
                accessibilityLabel={sheetOpen ? 'Ẩn chi tiết chuyến đi' : 'Xem chi tiết & bước rẽ'}
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: sheetOpen ? '#E7F8FA' : '#F1F5F8' }}
              >
                <Icon
                  name="format-list-bulleted"
                  size={22}
                  color={sheetOpen ? colors.primary : '#334E68'}
                />
              </Pressable>
              <Pressable
                onPress={stopNavigation}
                className="h-11 flex-row items-center gap-1.5 rounded-full bg-[#DC2626] px-4"
              >
                <Icon name="close" size={18} color="#FFFFFF" />
                <Text className="text-[13.5px] font-extrabold text-white">Thoát</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
      <Toast message={toast} />
    </SafeAreaView>
  );
}
