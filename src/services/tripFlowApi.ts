import { clientRequest } from './httpClient';
import { RECOMMENDATION_TIMEOUT_MS } from './config';

/**
 * Mirror tối giản của DTRPS-Web/src/client/api/tripFlowApi.ts — chỉ phần cần cho luồng
 * Tạo kế hoạch -> Gợi ý AI trên Mobile. Cùng Backend, cùng endpoint, cùng kiểu dữ liệu
 * (RecommendationController, RecommendationService.RecommendedPlace/RecommendationResponse,
 * PartnerPlaceService.PartnerPlace) — không tính điểm hay sinh lý do gợi ý ở phía Mobile.
 */

export type TravelPace = 'RELAXED' | 'BALANCED' | 'PACKED';

export interface CreateTravelPlanInput {
  title: string;
  destination: string;
  /** yyyy-MM-dd */
  startDate: string;
  endDate: string;
  budget: number | null;
  currency: string;
  groupSize: number;
  description: string | null;
  categoryCodes: string[];
  experiencePreferences?: string[];
  travelPace: TravelPace;
}

export interface TravelPlanResponse extends CreateTravelPlanInput {
  planId: number;
  userId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  estimatedCost: number | null;
}

export interface AiScoreBreakdown {
  semanticScore: number | null;
  categoryScore: number;
  budgetScore: number;
}

export interface AiRecommendedPlace {
  rank: number;
  placeId: number;
  name: string;
  address: string | null;
  categoryCode: string | null;
  categoryCodes: string[];
  imageUrl: string | null;
  priceType: string | null;
  referencePrice: number | null;
  latitude: number | null;
  longitude: number | null;
  score: number;
  breakdown: AiScoreBreakdown;
  /** Độ phù hợp 0-100 */
  matchPercent: number;
  /** Rất phù hợp / Phù hợp / Có thể bạn thích */
  matchLabel: string;
  /** Lý do gợi ý (tối đa 4) — lấy nguyên văn từ Backend, không tự sinh thêm. */
  reasons: string[];
  /** Lưu ý: chi phí cao, phải leo trèo... */
  cautions: string[];
}

export interface AiRecommendationResponse {
  planId: number;
  needed: number;
  available: number;
  degraded: boolean;
  items: AiRecommendedPlace[];
  warnings: string[];
}

export interface PartnerPlace {
  placeId: number;
  name: string;
  categoryCode: string | null;
  categoryName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  coverUrl: string | null;
  rating: number | null;
  reviewCount: number;
  businessName: string;
  verified: boolean;
}

export interface TripPlace {
  placeId: number;
  name: string;
  address: string | null;
  province: string | null;
  categoryCode: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  estimatedCost: number | null;
  currency: string | null;
  latitude: number | null;
  longitude: number | null;
  selected: boolean;
  source: string;
}

export interface SelectedPlacesResponse {
  planId: number;
  count: number;
  places: TripPlace[];
}

const planPath = (planId: number) => `/travel-plans/${planId}`;

export const tripFlowApi = {
  createPlan: (input: CreateTravelPlanInput) =>
    clientRequest<TravelPlanResponse>('/travel-plans', { method: 'POST', body: input }),

  plan: (planId: number) => clientRequest<TravelPlanResponse>(planPath(planId)),

  /** GET /travel-plans/{planId}/recommended-places — chậm (AI embedding), cần timeout dài hơn. */
  recommendedPlaces: (planId: number) =>
    clientRequest<AiRecommendationResponse>(`${planPath(planId)}/recommended-places`, {
      timeoutMs: RECOMMENDATION_TIMEOUT_MS,
    }),

  /** GET /travel-plans/{planId}/partner-places — địa điểm đối tác đã xác minh, không tính % phù hợp. */
  partnerPlaces: (planId: number) =>
    clientRequest<PartnerPlace[]>(`${planPath(planId)}/partner-places`),

  selectedPlaces: (planId: number) =>
    clientRequest<SelectedPlacesResponse>(`${planPath(planId)}/places`),

  addPlace: (planId: number, placeId: number) =>
    clientRequest<TripPlace>(`${planPath(planId)}/places`, {
      method: 'POST',
      body: { placeId },
    }),

  removePlace: (planId: number, placeId: number) =>
    clientRequest<void>(`${planPath(planId)}/places/${placeId}`, { method: 'DELETE' }),
};
