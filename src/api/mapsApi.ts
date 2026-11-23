import { buildQuery, clientRequest } from './http';
import type { GoongRoute, GoongVehicle } from './tripFlowApi';

/** Gọi Goong Directions qua Backend (key Goong chỉ giữ ở BE) */
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
};
