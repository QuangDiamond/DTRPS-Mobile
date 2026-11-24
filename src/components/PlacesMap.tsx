import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  type CameraRef,
  type LngLat,
  type PressEvent,
  type StyleSpecification,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  LogBox,
  Pressable,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, shadow } from '../theme';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Typography';
import { circleRing, distanceBetween } from '../utils/navGeo';

// MapLibre Native tự hủy request tile cũ khi zoom/pan nhanh — chỉ là log thông tin, không phải lỗi
LogBox.ignoreLogs(['MapLibre Native [WARN]']);

export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  /** Chữ trên ghim (số thứ tự) */
  label?: string;
  title?: string;
  /** Màu ghim: mặc định xanh chủ đạo */
  color?: string;
}

type LatLng = { latitude: number; longitude: number };

/** Một tuyến đường kèm nhãn thời gian/km vẽ trực tiếp lên bản đồ giống Google Maps */
export interface RouteOptionOverlay {
  index: number;
  coordinates: LatLng[];
  durationLabel: string;
  distanceLabel: string;
  diffLabel?: string;
  selected: boolean;
}

export interface PlacesMapHandle {
  focus: (latitude: number, longitude: number, zoomDelta?: number) => void;
  fitAll: () => void;
  /** Thu/phóng vừa khít một tập tọa độ tùy chọn (vd. các cây xăng gần vị trí hiện tại) */
  fitPoints: (targets: LatLng[]) => void;
}

/** Giữa Việt Nam [lng, lat] — dùng khi chưa có tọa độ (giống web) */
const VIETNAM_CENTER: LngLat = [106.5, 16.05];

/**
 * Key Goong Maptiles công khai — cùng giá trị VITE_GOONG_MAPTILES_KEY của web.
 * Khác GOONG_API_KEY bí mật của Backend (dùng cho chỉ đường).
 */
const GOONG_MAPTILES_KEY = process.env.EXPO_PUBLIC_GOONG_MAPTILES_KEY?.trim() ?? '';

/** Nền CARTO dự phòng khi chưa cấu hình Goong Maptiles key (giống web) */
const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: ['a', 'b', 'c', 'd'].map(
        (s) => `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png`,
      ),
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
};

/** Style bản đồ Goong (vector) giống web, hoặc CARTO nếu thiếu key */
const MAP_STYLE: string | StyleSpecification = GOONG_MAPTILES_KEY
  ? `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAPTILES_KEY}`
  : FALLBACK_STYLE;

/** Style ảnh vệ tinh chính thức của Goong (kèm tên đường Việt Nam), dự phòng Esri nếu thiếu key */
const SATELLITE_STYLE: string | StyleSpecification = GOONG_MAPTILES_KEY
  ? `https://tiles.goong.io/assets/goong_satellite.json?api_key=${GOONG_MAPTILES_KEY}`
  : {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: '© Esri World Imagery',
        },
        'esri-labels': {
          type: 'raster',
          tiles: [
            'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
        },
      },
      layers: [
        { id: 'esri-satellite', type: 'raster', source: 'esri-satellite' },
        { id: 'esri-labels', type: 'raster', source: 'esri-labels' },
      ],
    };

export const hasCoordinate = <T extends { latitude: number | null; longitude: number | null }>(
  item: T,
): item is T & { latitude: number; longitude: number } =>
  typeof item.latitude === 'number' &&
  Number.isFinite(item.latitude) &&
  Math.abs(item.latitude) <= 90 &&
  typeof item.longitude === 'number' &&
  Number.isFinite(item.longitude) &&
  Math.abs(item.longitude) <= 180;

/** Khoảng độ (delta) → mức zoom tương ứng */
const zoomFor = (delta: number) =>
  Math.min(18, Math.max(3, Math.log2(360 / Math.max(delta, 0.0005))));

const lineFeature = (list?: LatLng[]): GeoJSON.Feature | null =>
  list && list.length > 1
    ? {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: list.map((p) => [p.longitude, p.latitude]),
        },
      }
    : null;

/** Tìm điểm đặt nhãn hộp thời gian trên tuyến phụ sao cho xa tuyến đang chọn nhất (tránh đè nhãn) */
function pickRouteLabelAnchor(coords: LatLng[], reference: LatLng[]): LatLng | null {
  if (coords.length === 0) return null;
  if (coords.length < 3) return coords[0];
  const start = Math.floor(coords.length * 0.2);
  const end = Math.max(start + 1, Math.floor(coords.length * 0.8));
  if (reference.length === 0) {
    return coords[Math.floor(coords.length * 0.5)];
  }
  // Lấy mẫu ~25 điểm trên tuyến tham chiếu để tính khoảng cách cực nhanh
  const refStep = Math.max(1, Math.floor(reference.length / 25));
  const refSample: LatLng[] = [];
  for (let i = 0; i < reference.length; i += refStep) refSample.push(reference[i]);

  const step = Math.max(1, Math.floor((end - start) / 25));
  let best = coords[Math.floor((start + end) / 2)];
  let bestMinDist = -1;
  for (let i = start; i <= end; i += step) {
    const p = coords[i];
    let minDist = Infinity;
    for (const r of refSample) {
      const d = distanceBetween([p.latitude, p.longitude], [r.latitude, r.longitude]);
      if (d < minDist) minDist = d;
    }
    if (minDist > bestMinDist) {
      bestMinDist = minDist;
      best = p;
    }
  }
  return best;
}

/**
 * Bản đồ các địa điểm có ghim đánh số — bản mobile của TravelMap trên web: MapLibre + nền Goong,
 * hỗ trợ chế độ vệ tinh, tuyến phụ (detour/alternatives), mũi tên la bàn 3D và vòng sai số GPS.
 */
const PlacesMap = forwardRef<
  PlacesMapHandle,
  {
    points: MapPoint[];
    activeId?: string | null;
    onSelect?: (id: string) => void;
    /** Phần tuyến còn phải đi (hoặc cả tuyến khi chưa bám tuyến) */
    route?: LatLng[];
    /** Phần tuyến đã đi — vẽ màu xám */
    doneRoute?: LatLng[];
    /** Tuyến chính vẽ mờ phía sau khi đang rẽ tạm (vd. ghé cây xăng) hoặc tuyến thay thế */
    secondaryRoute?: LatLng[];
    /** Danh sách toàn bộ các tuyến (đang chọn + thay thế) để vẽ đồng thời kèm nhãn thời gian giống Google Maps */
    routeOptions?: RouteOptionOverlay[];
    /** Gọi khi người dùng bấm trực tiếp vào nhãn thời gian của 1 tuyến trên bản đồ */
    onSelectRouteOption?: (index: number) => void;
    /** Màu tuyến đang dẫn đường (mặc định xanh chủ đạo) */
    routeColor?: string;
    userLocation?: LatLng | null;
    /** Hướng đi (độ từ hướng Bắc) để vẽ mũi tên chỉ hướng */
    userHeading?: number | null;
    /** Sai số GPS (mét) để vẽ vòng tròn quanh vị trí */
    userAccuracy?: number | null;
    style?: StyleProp<ViewStyle>;
    /** Camera bám theo vị trí, xoay theo hướng đi (kiểu Google Maps) */
    followUser?: boolean;
    /** Bật chế độ ảnh vệ tinh (Satellite) */
    satellite?: boolean;
    /** Khoảng đệm đáy khi fitBounds để tuyến không bị thanh dưới che mất */
    fitBottomPadding?: number;
    /** Tắt tự động fitAll theo tuyến khi đổi points (vd. lúc đang zoom vào các cây xăng gần) */
    disableAutoFit?: boolean;
    /** Hiện nút la bàn tròn góc trên phải (xoay theo góc bản đồ, bấm để quay về hướng Bắc) */
    showCompass?: boolean;
    /** Người dùng tự kéo/xoay/zoom bản đồ → thường dùng để tắt followUser */
    onUserInteract?: () => void;
    /** Khi có: bấm lên bản đồ trả về tọa độ (chọn vị trí xuất phát thủ công) */
    onPick?: (latitude: number, longitude: number) => void;
  }
>(function PlacesMap(
  {
    points,
    activeId,
    onSelect,
    route,
    doneRoute,
    secondaryRoute,
    routeOptions,
    onSelectRouteOption,
    routeColor,
    userLocation,
    userHeading,
    userAccuracy,
    style,
    followUser,
    satellite,
    fitBottomPadding = 60,
    disableAutoFit = false,
    showCompass = false,
    onUserInteract,
    onPick,
  },
  ref,
) {
  const cameraRef = useRef<CameraRef>(null);
  const [bearing, setBearing] = useState(0);
  const bearingRef = useRef(0);
  const centerRef = useRef<LngLat>(VIETNAM_CENTER);
  const zoomRef = useRef(12);

  const coordinates = useMemo(() => {
    // Khi đã có tuyến đường thì ưu tiên căn khung nhìn theo đúng tuyến đang đi (+ vị trí GPS gần),
    // tránh bị các ghim khác ở xa (vd. điểm chính cách 200km khi đang rẽ cây xăng) kéo zoom ra ngoài.
    if (route && route.length > 1) {
      const list: LngLat[] = route.map((p): LngLat => [p.longitude, p.latitude]);
      if (userLocation) list.push([userLocation.longitude, userLocation.latitude]);
      return list;
    }
    const list: LngLat[] = points.map((p) => [p.longitude, p.latitude]);
    // Vị trí người dùng chỉ đưa vào khung nhìn khi ở gần điểm (≤ 30 km) — tránh GPS sai kéo bản đồ ra nước ngoài
    if (userLocation) {
      const anchor = points[0];
      const near =
        !anchor ||
        distanceBetween(
          [anchor.latitude, anchor.longitude],
          [userLocation.latitude, userLocation.longitude],
        ) <= 30_000;
      if (near) list.push([userLocation.longitude, userLocation.latitude]);
    }
    return list;
  }, [points, userLocation, route]);

  const fitBoundsList = (list: LngLat[]) => {
    const camera = cameraRef.current;
    if (!camera || list.length === 0) return;
    if (list.length === 1) {
      camera.easeTo({ center: list[0], zoom: 14, bearing: 0, pitch: 0, duration: 350 });
      return;
    }
    const lngs = list.map((c) => c[0]);
    const lats = list.map((c) => c[1]);
    camera.fitBounds([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)], {
      padding: { top: 70, right: 55, bottom: fitBottomPadding, left: 55 },
      bearing: 0,
      pitch: 0,
      duration: 350,
    });
  };

  const fitAll = () => fitBoundsList(coordinates);

  useImperativeHandle(ref, () => ({
    focus: (latitude, longitude, zoomDelta = 0.02) =>
      cameraRef.current?.easeTo({
        center: [longitude, latitude],
        zoom: zoomFor(zoomDelta),
        duration: 350,
      }),
    fitAll,
    fitPoints: (targets) => fitBoundsList(targets.map((p): LngLat => [p.longitude, p.latitude])),
  }));

  // Đổi danh sách điểm / tuyến → căn lại khung nhìn
  const signature = points.map((p) => p.id).join(',') + (route?.length ?? 0);
  useEffect(() => {
    if (followUser || disableAutoFit) return;
    const timer = setTimeout(fitAll, 350);
    return () => clearTimeout(timer);
  }, [signature]);

  // Chế độ bám theo: camera đi theo vị trí và xoay theo hướng di chuyển
  useEffect(() => {
    if (!followUser || !userLocation) return;
    cameraRef.current?.easeTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 17,
      pitch: 45,
      bearing: typeof userHeading === 'number' ? userHeading : bearingRef.current,
      duration: 700,
    });
  }, [followUser, userLocation?.latitude, userLocation?.longitude, userHeading]);

  const routeShape = useMemo(() => lineFeature(route), [route]);
  const doneShape = useMemo(() => lineFeature(doneRoute), [doneRoute]);
  const secondaryRouteShape = useMemo(() => lineFeature(secondaryRoute), [secondaryRoute]);

  // Tập hợp toàn bộ tuyến phụ chưa chọn thành 1 FeatureCollection để vẽ đồng thời màu xanh nhạt viền xám
  const altRoutesCollection = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!routeOptions || routeOptions.length < 2) return null;
    const features: GeoJSON.Feature[] = [];
    for (const opt of routeOptions) {
      if (opt.selected || opt.coordinates.length < 2) continue;
      features.push({
        type: 'Feature',
        properties: { index: opt.index },
        geometry: {
          type: 'LineString',
          coordinates: opt.coordinates.map((p) => [p.longitude, p.latitude]),
        },
      });
    }
    return features.length > 0 ? { type: 'FeatureCollection', features } : null;
  }, [routeOptions]);

  // Tính tọa độ đặt nhãn thời gian cho từng tuyến sao cho không đè lên nhau
  const routeBadges = useMemo(() => {
    if (!routeOptions || routeOptions.length < 2) return [];
    const selectedCoords =
      routeOptions.find((o) => o.selected)?.coordinates ?? routeOptions[0].coordinates;
    return routeOptions
      .map((opt) => {
        const anchor = opt.selected
          ? opt.coordinates[Math.floor(opt.coordinates.length * 0.5)]
          : pickRouteLabelAnchor(opt.coordinates, selectedCoords);
        return anchor ? { ...opt, anchor } : null;
      })
      .filter((item): item is RouteOptionOverlay & { anchor: LatLng } => item !== null);
  }, [routeOptions]);

  const accuracyShape = useMemo<GeoJSON.Feature | null>(
    () =>
      userLocation && typeof userAccuracy === 'number' && userAccuracy >= 15
        ? {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [
                circleRing(
                  [userLocation.latitude, userLocation.longitude],
                  Math.min(userAccuracy, 500),
                ),
              ],
            },
          }
        : null,
    [userLocation, userAccuracy],
  );

  const hasHeading = typeof userHeading === 'number';

  const resetNorth = () => {
    onUserInteract?.();
    cameraRef.current?.easeTo({
      center: centerRef.current,
      bearing: 0,
      pitch: 0,
      duration: 300,
    });
  };

  const handleMapPress = (event: NativeSyntheticEvent<PressEvent>) => {
    const [lng, lat] = event.nativeEvent.lngLat;
    if (onPick) {
      onPick(lat, lng);
      return;
    }
    // Chạm trực tiếp vào sợi đường xanh mờ trên bản đồ để đổi tuyến giống Google Maps.
    if (!onSelectRouteOption || !routeOptions || routeOptions.length < 2) return;

    const metersPerPixel =
      (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoomRef.current);
    const hitRadiusMeters = Math.max(35, metersPerPixel * 28);
    const tapped: [number, number] = [lat, lng];

    let bestIndex: number | null = null;
    let bestDist = hitRadiusMeters;

    for (const opt of routeOptions) {
      if (opt.selected || opt.coordinates.length < 2) continue;
      // Duyệt lấy mẫu dày để vừa mượt vừa chính xác
      const step = Math.max(1, Math.floor(opt.coordinates.length / 180));
      for (let i = 0; i < opt.coordinates.length; i += step) {
        const pt = opt.coordinates[i];
        const d = distanceBetween(tapped, [pt.latitude, pt.longitude]);
        if (d < bestDist) {
          bestDist = d;
          bestIndex = opt.index;
        }
      }
    }

    if (bestIndex !== null) {
      onSelectRouteOption(bestIndex);
    }
  };

  return (
    <View style={[{ flex: 1, position: 'relative' }, style]}>
      <Map
        style={{ flex: 1 }}
        mapStyle={satellite ? SATELLITE_STYLE : MAP_STYLE}
        logo={false}
        attribution={false}
        compass={false}
        onDidFinishLoadingMap={fitAll}
        onPress={
          onPick || (onSelectRouteOption && routeOptions && routeOptions.length > 1)
            ? handleMapPress
            : undefined
        }
        onRegionWillChange={(event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
          if (event.nativeEvent.userInteraction) onUserInteract?.();
        }}
        onRegionIsChanging={(event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
          bearingRef.current = event.nativeEvent.bearing;
          centerRef.current = event.nativeEvent.center;
          zoomRef.current = event.nativeEvent.zoom;
          setBearing(Math.round(event.nativeEvent.bearing));
        }}
        onRegionDidChange={(event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
          bearingRef.current = event.nativeEvent.bearing;
          centerRef.current = event.nativeEvent.center;
          zoomRef.current = event.nativeEvent.zoom;
          setBearing(Math.round(event.nativeEvent.bearing));
        }}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: coordinates[0] ?? VIETNAM_CENTER,
            zoom: coordinates[0] ? 12 : 4.5,
          }}
        />

        {accuracyShape ? (
          <GeoJSONSource id="accuracy" data={accuracyShape}>
            <Layer
              id="accuracy-fill"
              type="fill"
              paint={{ 'fill-color': '#2563EB', 'fill-opacity': 0.12 }}
            />
          </GeoJSONSource>
        ) : null}

        {altRoutesCollection ? (
          <GeoJSONSource id="alt-routes" data={altRoutesCollection}>
            <Layer
              id="alt-routes-casing"
              type="line"
              paint={{ 'line-color': '#475569', 'line-width': 7.5, 'line-opacity': 0.55 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
            <Layer
              id="alt-routes-line"
              type="line"
              paint={{ 'line-color': '#BAE6FD', 'line-width': 5, 'line-opacity': 0.92 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
          </GeoJSONSource>
        ) : secondaryRouteShape ? (
          <GeoJSONSource id="secondary-route" data={secondaryRouteShape}>
            <Layer
              id="secondary-route-line"
              type="line"
              paint={{ 'line-color': '#94A3B8', 'line-width': 4, 'line-opacity': 0.55 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
          </GeoJSONSource>
        ) : null}

        {routeShape ? (
          <GeoJSONSource id="route" data={routeShape}>
            <Layer
              id="route-casing"
              type="line"
              paint={{ 'line-color': '#FFFFFF', 'line-width': 9, 'line-opacity': 0.9 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
            <Layer
              id="route-line"
              type="line"
              paint={{ 'line-color': routeColor ?? colors.primary, 'line-width': 6 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
          </GeoJSONSource>
        ) : null}

        {doneShape ? (
          <GeoJSONSource id="route-done" data={doneShape}>
            <Layer
              id="route-done-line"
              type="line"
              paint={{ 'line-color': '#9AA9B3', 'line-width': 6 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
          </GeoJSONSource>
        ) : null}

        {/* Nhãn thời gian + km nổi trực tiếp trên từng tuyến đường giống Google Maps (bấm để chọn tuyến) */}
        {routeBadges.map((badge) => (
          <Marker
            key={`route-badge-${badge.index}`}
            id={`route-badge-${badge.index}`}
            lngLat={[badge.anchor.longitude, badge.anchor.latitude]}
            anchor="center"
            onPress={() => onSelectRouteOption?.(badge.index)}
          >
            <View
              style={[
                shadow.raised,
                {
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 10,
                  backgroundColor: badge.selected ? '#0E7490' : '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: badge.selected ? '#FFFFFF' : '#CBD5E1',
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: '800',
                  color: badge.selected ? '#FFFFFF' : '#13364A',
                }}
              >
                {badge.durationLabel}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: badge.selected ? '#CCFBF1' : '#64748B',
                }}
              >
                {badge.diffLabel
                  ? `${badge.distanceLabel} · ${badge.diffLabel}`
                  : badge.distanceLabel}
              </Text>
            </View>
          </Marker>
        ))}

        {points.map((point) => {
          const active = point.id === activeId;
          return (
            <Marker
              key={point.id}
              id={point.id}
              lngLat={[point.longitude, point.latitude]}
              anchor="center"
              onPress={() => onSelect?.(point.id)}
            >
              <View
                accessibilityLabel={point.title}
                style={{
                  minWidth: active ? 34 : 28,
                  height: active ? 34 : 28,
                  borderRadius: 17,
                  paddingHorizontal: 4,
                  backgroundColor: active ? colors.ink : (point.color ?? colors.primary),
                  borderWidth: 2.5,
                  borderColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                  {point.label ?? '•'}
                </Text>
              </View>
            </Marker>
          );
        })}

        {userLocation ? (
          <Marker id="me" lngLat={[userLocation.longitude, userLocation.latitude]} anchor="center">
            {hasHeading ? (
              <View
                accessibilityLabel="Vị trí của bạn"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: '#2563EB',
                  borderWidth: 3,
                  borderColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // Mũi tên chỉ hướng, bù góc xoay hiện tại của bản đồ
                  transform: [
                    { rotate: `${((((userHeading as number) - bearing) % 360) + 360) % 360}deg` },
                  ],
                }}
              >
                <Icon name="navigation" size={18} color="#FFFFFF" />
              </View>
            ) : (
              <View
                accessibilityLabel="Vị trí của bạn"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#2563EB',
                  borderWidth: 3,
                  borderColor: '#FFFFFF',
                }}
              />
            )}
          </Marker>
        ) : null}
      </Map>

      {/* La bàn tròn chuẩn Google Maps: kim đỏ/xám vát nhọn + chấm tâm + xoay realtime theo góc bản đồ */}
      {showCompass ? (
        <Pressable
          onPress={resetNorth}
          accessibilityLabel="Quay bản đồ về hướng Bắc"
          style={[
            shadow.raised,
            {
              position: 'absolute',
              top: 12,
              right: 12,
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: 'rgba(255,255,255,0.96)',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <View
            style={{
              width: 30,
              height: 30,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: `${((-bearing % 360) + 360) % 360}deg` }],
            }}
          >
            {/* Đầu kim đỏ chỉ Bắc (Google Maps red #EA4335) */}
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 5.5,
                borderRightWidth: 5.5,
                borderBottomWidth: 13,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: '#EA4335',
              }}
            />
            {/* Đầu kim xám chỉ Nam (Google Maps grey #BDC1C6) */}
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 5.5,
                borderRightWidth: 5.5,
                borderTopWidth: 13,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderTopColor: '#BDC1C6',
              }}
            />
            {/* Chấm trục trắng ở giữa kim giống Google Maps */}
            <View
              style={{
                position: 'absolute',
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#CBD5E1',
              }}
            />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
});

export default PlacesMap;
