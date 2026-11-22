import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import ExploreScreen from '../screens/explore/ExploreScreen';
import PlaceDetailScreen from '../screens/explore/PlaceDetailScreen';
import FavoritesScreen from '../screens/favorites/FavoritesScreen';
import HomeScreen from '../screens/home/HomeScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import PreferencesScreen from '../screens/preferences/PreferencesScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import EditPlanScreen from '../screens/trips/EditPlanScreen';
import GeneratingTripScreen from '../screens/trips/GeneratingTripScreen';
import ItineraryDayScreen from '../screens/trips/ItineraryDayScreen';
import ItineraryOverviewScreen from '../screens/trips/ItineraryOverviewScreen';
import LiveMapScreen from '../screens/trips/LiveMapScreen';
import MyTripsScreen from '../screens/trips/MyTripsScreen';
import PlanTripScreen from '../screens/trips/PlanTripScreen';
import SelectedPlacesScreen from '../screens/trips/SelectedPlacesScreen';
import SuggestedPlacesScreen from '../screens/trips/SuggestedPlacesScreen';
import SuggestionDetailScreen from '../screens/trips/SuggestionDetailScreen';
import { colors } from '../theme';
import { Icon, type IconName } from '../ui/Icon';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, { icon: IconName; label: string }> = {
  Home: { icon: 'home', label: 'Trang chủ' },
  Explore: { icon: 'explore', label: 'Khám phá' },
  Trips: { icon: 'luggage', label: 'Chuyến đi' },
  Favorites: { icon: 'favorite', label: 'Yêu thích' },
  Profile: { icon: 'person', label: 'Tài khoản' },
};

/** Thanh tab dưới — cùng các mục với thanh điều hướng du khách của web */
function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#8193A0',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        // Không đặt chiều cao cố định: thư viện tự cộng khoảng thanh điều hướng của Android
        tabBarStyle: { borderTopColor: '#E5F1F4' },
        tabBarItemStyle: { paddingTop: 4 },
        tabBarLabel: TAB_ICONS[route.name].label,
        tabBarIcon: ({ color }) => <Icon name={TAB_ICONS[route.name].icon} size={24} color={color} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Trips" component={MyTripsScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

/**
 * Khách chưa đăng nhập: màn chào + đăng nhập/đăng ký, vẫn xem được Trang chủ, Khám phá, chi tiết
 * địa điểm (giống web). Đăng nhập xong danh sách màn hình tự đổi sang khu đã đăng nhập.
 */
export default function RootNavigator() {
  const { ready, user, endedReason } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {user ? (
        <Stack.Group>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
          <Stack.Screen name="Preferences" component={PreferencesScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="PlanTrip" component={PlanTripScreen} />
          <Stack.Screen name="EditPlan" component={EditPlanScreen} />
          <Stack.Screen name="GeneratingTrip" component={GeneratingTripScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Suggestions" component={SuggestedPlacesScreen} />
          <Stack.Screen name="SuggestionDetail" component={SuggestionDetailScreen} />
          <Stack.Screen name="SelectedPlaces" component={SelectedPlacesScreen} />
          <Stack.Screen name="Itinerary" component={ItineraryOverviewScreen} />
          <Stack.Screen name="ItineraryDay" component={ItineraryDayScreen} />
          <Stack.Screen name="LiveMap" component={LiveMapScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          {/* Phiên vừa hết hạn → mở thẳng màn Đăng nhập kèm lý do */}
          {endedReason ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
          )}
          {endedReason ? (
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
