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
import { View, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../theme';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Typography';
import { circleRing, distanceBetween } from '../utils/navGeo';

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

export interface PlacesMapHandle {
  focus: (latitude: number, longitude: number, zoomDelta?: number) => void;
  fitAll: () => void;
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
const zoomFor = (delta: number) => Math.min(18, Math.max(3, Math.log2(360 / Math.max(delta, 0.0005))));

/**
 * Bản đồ các địa điểm có ghim đánh số — bản mobile của TravelMap trên web: MapLibre + nền Goong,
 * không cần khoá Google Maps.
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
    userLocation?: LatLng | null;
    /** Hướng đi (độ từ hướng Bắc) để vẽ mũi tên chỉ hướng */
    userHeading?: number | null;
    /** Sai số GPS (mét) để vẽ vòng tròn quanh vị trí */
    userAccuracy?: number | null;
    style?: StyleProp<ViewStyle>;
    /** Camera bám theo vị trí, xoay theo hướng đi (kiểu Google Maps) */
    followUser?: boolean;
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
    userLocation,
    userHeading,
    userAccuracy,
    style,
    followUser,
    onUserInteract,
    onPick,
  },
  ref,
) {
  const cameraRef = useRef<CameraRef>(null);
  const [bearing, setBearing] = useState(0);
  const bearingRef = useRef(0);

  const coordinates = useMemo(() => {
    const list: LngLat[] = points.map((p) => [p.longitude, p.latitude]);
    if (route) list.push(...route.map((p): LngLat => [p.longitude, p.latitude]));
    // Vị trí người dùng chỉ đưa vào khung nhìn khi ở gần tuyến/điểm (≤ 30 km) — tránh GPS sai kéo bản đồ ra nước ngoài
    if (userLocation) {
      const anchor = points[0] ?? route?.[0];
      const near =
        !anchor ||
        distanceBetween([anchor.latitude, anchor.longitude], [userLocation.latitude, userLocation.longitude]) <= 30_000;
      if (near) list.push([userLocation.longitude, userLocation.latitude]);
    }
    return list;
  }, [points, userLocation, route]);

  const fitAll = () => {
    const camera = cameraRef.current;
    if (!camera || coordinates.length === 0) return;
    if (coordinates.length === 1) {
      camera.easeTo({ center: coordinates[0], zoom: 14, bearing: 0, pitch: 0, duration: 350 });
      return;
    }
    const lngs = coordinates.map((c) => c[0]);
    const lats = coordinates.map((c) => c[1]);
    camera.fitBounds([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)], {
      padding: { top: 60, right: 50, bottom: 60, left: 50 },
      bearing: 0,
      pitch: 0,
      duration: 350,
    });
  };

  useImperativeHandle(ref, () => ({
    focus: (latitude, longitude, zoomDelta = 0.02) =>
      cameraRef.current?.easeTo({ center: [longitude, latitude], zoom: zoomFor(zoomDelta), duration: 350 }),
    fitAll,
  }));

  // Đổi danh sách điểm / tuyến → căn lại khung nhìn
  const signature = points.map((p) => p.id).join(',') + (route?.length ?? 0);
  useEffect(() => {
    if (followUser) return;
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

  const lineFeature = (list?: LatLng[]): GeoJSON.Feature | null =>
    list && list.length > 1
      ? {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: list.map((p) => [p.longitude, p.latitude]) },
        }
      : null;

  const routeShape = useMemo(() => lineFeature(route), [route]);
  const doneShape = useMemo(() => lineFeature(doneRoute), [doneRoute]);

  const accuracyShape = useMemo<GeoJSON.Feature | null>(
    () =>
      userLocation && typeof userAccuracy === 'number' && userAccuracy >= 15
        ? {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [circleRing([userLocation.latitude, userLocation.longitude], Math.min(userAccuracy, 500))],
            },
          }
        : null,
    [userLocation, userAccuracy],
  );

  const hasHeading = typeof userHeading === 'number';

  return (
    <Map
      style={[{ flex: 1 }, style]}
      mapStyle={MAP_STYLE}
      logo={false}
      attribution={false}
      compass={false}
      onDidFinishLoadingMap={fitAll}
      onPress={
        onPick
          ? (event: NativeSyntheticEvent<PressEvent>) => {
              const [lng, lat] = event.nativeEvent.lngLat;
              onPick(lat, lng);
            }
          : undefined
      }
      onRegionWillChange={(event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
        if (event.nativeEvent.userInteraction) onUserInteract?.();
      }}
      onRegionDidChange={(event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
        bearingRef.current = event.nativeEvent.bearing;
        setBearing(Math.round(event.nativeEvent.bearing));
      }}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{ center: coordinates[0] ?? VIETNAM_CENTER, zoom: coordinates[0] ? 12 : 4.5 }}
      />

      {accuracyShape ? (
        <GeoJSONSource id="accuracy" data={accuracyShape}>
          <Layer id="accuracy-fill" type="fill" style={{ fillColor: '#2563EB', fillOpacity: 0.12 }} />
        </GeoJSONSource>
      ) : null}

      {routeShape ? (
        <GeoJSONSource id="route" data={routeShape}>
          <Layer
            id="route-casing"
            type="line"
            style={{ lineColor: '#FFFFFF', lineWidth: 9, lineCap: 'round', lineJoin: 'round' }}
          />
          <Layer
            id="route-line"
            type="line"
            style={{ lineColor: colors.primary, lineWidth: 6, lineCap: 'round', lineJoin: 'round' }}
          />
        </GeoJSONSource>
      ) : null}

      {doneShape ? (
        <GeoJSONSource id="route-done" data={doneShape}>
          <Layer
            id="route-done-line"
            type="line"
            style={{ lineColor: '#9AA9B3', lineWidth: 6, lineCap: 'round', lineJoin: 'round' }}
          />
        </GeoJSONSource>
      ) : null}

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
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>{point.label ?? '•'}</Text>
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
                transform: [{ rotate: `${(((userHeading as number) - bearing) % 360 + 360) % 360}deg` }],
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
  );
});

export default PlacesMap;
