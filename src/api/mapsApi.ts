import { buildQuery, clientRequest } from './http';
import type { GoongRoute, GoongVehicle } from './tripFlowApi';

export interface NearbyPlace {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
}

/** Gọi Goong Directions & tìm địa điểm gần qua Backend (key Goong chỉ giữ ở BE) */
export const mapsApi = {
  directions: (params: {
    fromLat: number;
    fromLng: number;
    toLat: number;
    toLng: number;
    vehicle?: GoongVehicle;
  }) =>
    clientRequest<GoongRoute>(
      `/maps/directions?${buildQuery({
        fromLat: params.fromLat,
        fromLng: params.fromLng,
        toLat: params.toLat,
        toLng: params.toLng,
        vehicle: params.vehicle ?? 'car',
      })}`,
    ),
  nearby: (params: { lat: number; lng: number; keyword?: string; radius?: number }) =>
    clientRequest<NearbyPlace[]>(
      `/maps/nearby?${buildQuery({
        lat: params.lat,
        lng: params.lng,
        keyword: params.keyword ?? 'cây xăng',
        radius: params.radius ?? 5,
      })}`,
    ),
};
