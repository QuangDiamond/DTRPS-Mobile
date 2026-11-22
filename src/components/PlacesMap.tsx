import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  type CameraRef,
  type LngLat,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../theme';
import { Text } from '../ui/Typography';

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
    route?: LatLng[];
    userLocation?: LatLng | null;
    style?: StyleProp<ViewStyle>;
    followUser?: boolean;
  }
>(function PlacesMap({ points, activeId, onSelect, route, userLocation, style, followUser }, ref) {
  const cameraRef = useRef<CameraRef>(null);

  const coordinates = useMemo(() => {
    const list: LngLat[] = points.map((p) => [p.longitude, p.latitude]);
    if (userLocation) list.push([userLocation.longitude, userLocation.latitude]);
    if (route) list.push(...route.map((p): LngLat => [p.longitude, p.latitude]));
    return list;
  }, [points, userLocation, route]);

  const fitAll = () => {
    const camera = cameraRef.current;
    if (!camera || coordinates.length === 0) return;
    if (coordinates.length === 1) {
      camera.easeTo({ center: coordinates[0], zoom: 14, duration: 350 });
      return;
    }
    const lngs = coordinates.map((c) => c[0]);
    const lats = coordinates.map((c) => c[1]);
    camera.fitBounds([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)], {
      padding: { top: 60, right: 50, bottom: 60, left: 50 },
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

  const routeShape = useMemo<GeoJSON.Feature | null>(
    () =>
      route && route.length > 1
        ? {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: route.map((p) => [p.longitude, p.latitude]) },
          }
        : null,
    [route],
  );

  return (
    <Map
      style={[{ flex: 1 }, style]}
      mapStyle={MAP_STYLE}
      logo={false}
      attribution={false}
      compass={false}
      onDidFinishLoadingMap={fitAll}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{ center: coordinates[0] ?? VIETNAM_CENTER, zoom: coordinates[0] ? 12 : 4.5 }}
      />

      {routeShape ? (
        <GeoJSONSource id="route" data={routeShape}>
          <Layer
            id="route-line"
            type="line"
            style={{ lineColor: colors.primary, lineWidth: 5, lineCap: 'round', lineJoin: 'round' }}
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
        </Marker>
      ) : null}
    </Map>
  );
});

export default PlacesMap;
