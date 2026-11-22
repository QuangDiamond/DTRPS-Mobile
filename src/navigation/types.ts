import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AiRecommendationResponse } from '../api/tripFlowApi';

/** Tab dưới cùng — giống thanh điều hướng của web du khách */
export type TabParamList = {
  Home: undefined;
  Explore: { q?: string; province?: string } | undefined;
  Trips: undefined;
  Favorites: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  // ===== Chưa đăng nhập =====
  Welcome: undefined;
  Login: { email?: string; notice?: string } | undefined;
  Register: undefined;
  ForgotPassword: undefined;

  // ===== App =====
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  PlaceDetail: { placeId: number };

  // Tài khoản
  EditProfile: undefined;
  ChangePassword: undefined;
  Settings: undefined;
  Preferences: { notice?: string } | undefined;
  Notifications: undefined;

  // Luồng lập kế hoạch (6 bước như web)
  PlanTrip: undefined;
  EditPlan: { planId: number };
  GeneratingTrip: { planId: number };
  Suggestions: { planId: number; recommendation?: AiRecommendationResponse };
  SuggestionDetail: { planId: number; placeId: number };
  SelectedPlaces: { planId: number };

  // Lịch trình
  Itinerary: { planId: number; warnings?: string[] };
  ItineraryDay: { planId: number; day: number };
  LiveMap: { planId: number; day: number };
};

export type RootScreenProps<K extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  K
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
