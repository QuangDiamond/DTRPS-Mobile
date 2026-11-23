import { useEffect, useMemo, useRef } from 'react';
import type { GoongRoute } from '../api/tripFlowApi';
import type { GpsFix } from './useGpsTracker';
import {
  arrivalRadius,
  buildRouteIndex,
  distanceBetween,
  formatMeters,
  maneuverIcon,
  snapToRoute,
  splitRoute,
  stepPositions,
  upcomingStep,
  type Coordinate,
  type ManeuverIcon,
} from './navGeo';

export interface Guidance {
  icon: ManeuverIcon | 'flag' | 'alt-route';
  title: string;
  text: string;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Giải mã encoded polyline của Goong thành danh sách [lat, lng]. */
export function decodePolyline(encoded: string): Coordinate[] {
  const coordinates: Coordinate[] = [];
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
    coordinates.push([latitude / 1e5, longitude / 1e5]);
  }
  return coordinates;
}

export const toLatLng = ([latitude, longitude]: Coordinate): LatLng => ({ latitude, longitude });

interface Options {
  route: GoongRoute | null;
  fix: GpsFix | null;
  /** Tên và tọa độ điểm đến để nhận biết "đã đến nơi". */
  destination: { name: string; coordinate: Coordinate } | null;
  loading: boolean;
  /** Chỉ dẫn đường khi true (vd. ngày đang đi). */
  active: boolean;
  /** Gọi khi cần tính lại đường vì đi lệch tuyến. */
  onOffRoute: () => void;
}

/**
 * Bám vị trí vào tuyến Goong, tính chỉ dẫn rẽ kế tiếp, quãng đường còn lại và
 * phát hiện đi lệch tuyến (bản mobile của phần dẫn đường trong TripLiveMapPage).
 */
export function useNavigationGuidance({ route, fix, destination, loading, active, onOffRoute }: Options) {
  const offRouteCount = useRef(0);
  const lastReroute = useRef(0);
  const onOffRouteRef = useRef(onOffRoute);
  onOffRouteRef.current = onOffRoute;

  const myLocation = fix?.coordinate ?? null;
  const steps = useMemo(() => route?.steps ?? [], [route]);

  const points = useMemo(() => (route?.polyline ? decodePolyline(route.polyline) : []), [route]);
  const routeIndex = useMemo(() => (points.length > 1 ? buildRouteIndex(points) : null), [points]);
  const stepOffsets = useMemo(
    () => (routeIndex && steps.length > 0 ? stepPositions(routeIndex, steps) : []),
    [routeIndex, steps],
  );
  const snap = useMemo(
    () => (routeIndex && myLocation ? snapToRoute(routeIndex, myLocation) : null),
    [routeIndex, myLocation],
  );

  const onRouteLimit = Math.min(120, Math.max(35, (fix?.accuracy ?? 0) * 1.2));
  const onRoute = Boolean(snap && snap.distanceFromRoute <= onRouteLimit);

  // Chấm xanh nằm trên đường khi đang đi đúng tuyến.
  const displayLocation: Coordinate | null = snap && onRoute ? snap.coordinate : myLocation;

  const parts = useMemo(() => {
    if (!routeIndex) return { done: [] as Coordinate[], todo: [] as Coordinate[] };
    if (snap && onRoute) return splitRoute(routeIndex, snap);
    return { done: [] as Coordinate[], todo: routeIndex.points };
  }, [routeIndex, snap, onRoute]);

  const remaining = useMemo(() => {
    if (!route) return null;
    const total = route.distanceMeters;
    const seconds = route.durationSeconds;
    if (snap && onRoute && routeIndex && routeIndex.total > 0) {
      const left = Math.max(0, 1 - snap.along / routeIndex.total);
      return { meters: total * left, seconds: seconds * left };
    }
    return { meters: total, seconds };
  }, [route, snap, onRoute, routeIndex]);

  const arrived = Boolean(
    active &&
      myLocation &&
      destination &&
      distanceBetween(myLocation, destination.coordinate) <= arrivalRadius(fix?.accuracy),
  );

  const guidance = useMemo<Guidance | null>(() => {
    if (!active || !destination) return null;
    if (arrived) return { icon: 'flag', title: 'Bạn đã đến nơi', text: destination.name };
    if (!route) return null;

    if (snap && !onRoute) {
      return {
        icon: 'alt-route',
        title: 'Bạn đã chệch tuyến',
        text: loading ? 'Đang tính lại đường...' : 'Đang chờ tuyến đường mới',
      };
    }
    if (steps.length === 0) return null;

    if (snap && onRoute) {
      const next = upcomingStep(steps, stepOffsets, snap.along);
      if (next) {
        return {
          icon: maneuverIcon(next.step.maneuver),
          title: `Sau ${formatMeters(next.distance)}`,
          text: next.step.instruction,
        };
      }
      return {
        icon: 'straight',
        title: remaining ? `Còn ${formatMeters(remaining.meters)}` : 'Đi thẳng',
        text: `Đi tới ${destination.name}`,
      };
    }

    const first = steps[0];
    return { icon: maneuverIcon(first.maneuver), title: formatMeters(first.distanceMeters), text: first.instruction };
  }, [active, destination, arrived, route, snap, onRoute, steps, stepOffsets, remaining, loading]);

  // Đi lệch tuyến 2 lần GPS liên tiếp → tính lại đường (tối thiểu cách nhau 8 giây).
  useEffect(() => {
    if (!active || !snap || !route || !fix) {
      offRouteCount.current = 0;
      return;
    }
    if (onRoute) {
      offRouteCount.current = 0;
      return;
    }
    offRouteCount.current += 1;
    if (offRouteCount.current < 2 || loading) return;
    const now = Date.now();
    if (now - lastReroute.current < 8_000) return;
    lastReroute.current = now;
    offRouteCount.current = 0;
    onOffRouteRef.current();
  }, [active, snap, onRoute, route, fix, loading]);

  return { onRoute, displayLocation, parts, remaining, arrived, guidance, points };
}
