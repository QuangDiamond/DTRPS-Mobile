
import './global.css';
import ProfileChangePasswordScreen from './src/screens/profile/ProfileChangePasswordScreen';

import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BusinessOwnerNavigator from './src/screens/businessOwner/BusinessOwnerNavigator';

import WelcomeScreen from './src/screens/welcome/WelcomeScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegistrationScreen } from './src/screens/auth/RegistrationScreen';
import { ForgotPasswordScreen } from './src/screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from './src/screens/auth/ResetPasswordScreen';
import { ChangePasswordScreen } from './src/screens/auth/ChangePasswordScreen';

import HomeScreen from './src/screens/home/HomeScreen';

import ProfileScreen from './src/screens/profile/ProfileScreen';
import EditProfileScreen, {
  defaultProfile,
  type EditableProfile,
} from './src/screens/profile/EditProfileScreen';
import SettingsScreen from './src/screens/profile/SettingsScreen';

import SearchFilterScreen from './src/screens/explore/SearchFilterScreen';


import ExploreScreen from './src/screens/explore/ExploreScreen';
import PlaceDetailsScreen from './src/screens/explore/PlaceDetailsScreen';
import FavoritesScreen from './src/screens/favorites/FavoritesScreen';
import MyTripsScreen from './src/screens/trips/MyTripsScreen';
import AddLocationScreen from './src/screens/trips/AddLocationScreen';
import TravelPreferencesScreen from './src/screens/preferences/TravelPreferencesScreen';
import PlanTripScreen from './src/screens/trips/PlanTripScreen';
import GeneratingTripScreen from './src/screens/trips/GeneratingTripScreen';
import SuggestedPlacesScreen from './src/screens/trips/SuggestedPlacesScreen';
import {
  emptyPreferences,
  type TravelPreferences,
} from './src/constants/travelPreferences';

import type { AppTab } from './src/components/BottomTabBar';
import type { RootStackParamList } from './src/types/featureRoutes';

type AppRoutes = RootStackParamList & {
  MainTabs: { tab?: AppTab } | undefined;
  HomeSearchFilter: undefined;
  BusinessOwnerFlow: undefined;
  TravelPreferences: undefined;
  PlanTrip: undefined;
  GeneratingTrip: { destinationId: string; days: number; interests: string[] };
  SuggestedPlaces: { destinationId: string; interests: string[] };
};

const Stack = createNativeStackNavigator<AppRoutes>();

function MainTabsScreen({
  onHomePress,
  initialTab = 'profile',
}: {
  onHomePress: () => void;
  initialTab?: AppTab;
}) {
  const [activeTab, setActiveTab] = useState<AppTab>(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [isSettings, setIsSettings] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAddingLocation, setIsAddingLocation] = useState(false);

  const [selectedPlaceId, setSelectedPlaceId] =
    useState<string | null>(null);

  const [favorites, setFavorites] = useState<string[]>([
    'ba-na',
    'hoi-an',
    'ha-long',
  ]);

  const [profile, setProfile] =
    useState<EditableProfile>(defaultProfile);

  const toggleFavorite = (placeId: string) => {
    setFavorites(previous =>
      previous.includes(placeId)
        ? previous.filter(id => id !== placeId)
        : [...previous, placeId]
    );
  };

  const handleTabPress = (tab: AppTab) => {
    if (tab === 'home') {
      onHomePress();
      return;
    }

    if (
      tab === 'profile' ||
      tab === 'explore' ||
      tab === 'favorites' ||
      tab === 'trips'
    ) {
      setSelectedPlaceId(null);
      setIsEditing(false);
      setIsSettings(false);
      setIsChangingPassword(false);
      setIsAddingLocation(false);
      setActiveTab(tab);
      return;
    }

    Alert.alert(
      'Điều hướng',
      'Chức năng đang được phát triển.'
    );
  };

  // Chuyến đi của tôi
  if (activeTab === 'trips') {
    if (isAddingLocation) {
      return (
        <AddLocationScreen
          onBack={() => setIsAddingLocation(false)}
        />
      );
    }

    return (
      <MyTripsScreen
        onTabPress={handleTabPress}
        onCreateTripPress={() => setIsAddingLocation(true)}
      />
    );
  }

  // Explore và Favorites
  if (activeTab === 'explore' || activeTab === 'favorites') {
    return (
      <View style={{ flex: 1 }}>
        {activeTab === 'explore' ? (
          <ExploreScreen
            onTabPress={handleTabPress}
            onPlacePress={setSelectedPlaceId}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <FavoritesScreen
            onTabPress={handleTabPress}
            onPlacePress={setSelectedPlaceId}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {selectedPlaceId && (
          <View style={StyleSheet.absoluteFill}>
            <PlaceDetailsScreen
              placeId={selectedPlaceId}
              favorite={favorites.includes(selectedPlaceId)}
              onToggleFavorite={() =>
                toggleFavorite(selectedPlaceId)
              }
              onBack={() => setSelectedPlaceId(null)}
              onProfilePress={() =>
                handleTabPress('profile')
              }
            />
          </View>
        )}
      </View>
    );
  }


// ==================== CHANGE PASSWORD ====================

  if (isChangingPassword) {
    return (
      <ProfileChangePasswordScreen
        onBack={() => setIsChangingPassword(false)}
      />
    );
  }


  // Edit Profile
  if (isEditing) {
    return (
      <EditProfileScreen
        initialProfile={profile}
        onBack={() => setIsEditing(false)}
        onSave={updatedProfile => {
          setProfile(updatedProfile);
          setIsEditing(false);
        }}
      />
    );
  }

  // Settings
  if (isSettings) {
    return (
      <SettingsScreen
        onBackPress={() => setIsSettings(false)}
        onEditProfilePress={() => setIsEditing(true)}
        onMyTripsPress={() => handleTabPress('trips')}
        onFavoritePlacesPress={() =>
          handleTabPress('favorites')
        }
        onNotificationsPress={() => {
          Alert.alert(
            'Thông báo',
            'Chức năng đang được phát triển.'
          );
        }}
        onAppSettingsPress={() => {
          Alert.alert(
            'Cài đặt ứng dụng',
            'Chức năng đang được phát triển.'
          );
        }}
        onLogoutPress={() => {
          Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Đăng xuất',
                style: 'destructive',
                onPress: () => {
                  Alert.alert(
                    'Thông báo',
                    'Chức năng đăng xuất sẽ được tích hợp sau.'
                  );
                },
              },
            ]
          );
        }}
        onTabPress={tab => {
          if (tab === 'favorite') {
            handleTabPress('favorites');
          } else if (tab === 'trip') {
            handleTabPress('trips');
          } else {
            handleTabPress(tab as AppTab);
          }
        }}
      />
    );
  }

  // Profile
  return (
    <ProfileScreen
      profileName={profile.name}
      profileEmail={profile.email}
      onTabPress={handleTabPress}
      onEditProfilePress={() => setIsEditing(true)}
      onSettingsPress={() => setIsSettings(true)}
      onChangePasswordPress={() => setIsChangingPassword(true)}
    />
  );
}

export default function App() {
  // Sở thích du lịch của người dùng (chưa có backend nên lưu tạm ở đây)
  const [travelPreferences, setTravelPreferences] =
    useState<TravelPreferences>(emptyPreferences);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Registration"
          component={RegistrationScreen}
        />

        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
        />

        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
        />

        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
        />

        <Stack.Screen name="Home">
          {({ navigation }) => (
            <HomeScreen
              onProfilePress={() =>
                navigation.navigate('MainTabs', {
                  tab: 'profile',
                })
              }

              onFilterPress={() => {
                navigation.navigate('HomeSearchFilter');
              }}
              onPartnerPress={() =>
                navigation.navigate('BusinessOwnerFlow')
              }
              onSetupPreferencesPress={() =>
                navigation.navigate('TravelPreferences')
              }
              onPlanTripPress={() => navigation.navigate('PlanTrip')}
              onTabPress={tab => {
                if (tab === 'home') return;

                navigation.navigate('MainTabs', { tab });
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="TravelPreferences">
          {({ navigation }) => (
            <TravelPreferencesScreen
              initialPreferences={travelPreferences}
              onBack={() => navigation.goBack()}
              onComplete={preferences => {
                setTravelPreferences(preferences);
                Alert.alert(
                  'Đã lưu sở thích',
                  'SmartTravel sẽ gợi ý điểm đến và lịch trình phù hợp hơn với bạn.'
                );
                navigation.goBack();
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="PlanTrip">
          {({ navigation }) => (
            <PlanTripScreen
              preferences={travelPreferences}
              onBack={() => navigation.goBack()}
              onSubmit={plan =>
                navigation.navigate('GeneratingTrip', {
                  destinationId: plan.destinationId,
                  days: plan.days,
                  interests: plan.interests,
                })
              }
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="GeneratingTrip"
          options={{ gestureEnabled: false }}
        >
          {({ navigation, route }) => (
            <GeneratingTripScreen
              destinationId={route.params.destinationId}
              days={route.params.days}
              onCancel={() => navigation.goBack()}
              // Thay màn Đang tạo bằng màn Gợi ý để nút Back quay về Lập kế hoạch
              onDone={() =>
                navigation.replace('SuggestedPlaces', {
                  destinationId: route.params.destinationId,
                  interests: route.params.interests,
                })
              }
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="SuggestedPlaces">
          {({ navigation, route }) => (
            <SuggestedPlacesScreen
              destinationId={route.params.destinationId}
              interests={route.params.interests}
              onBack={() => navigation.goBack()}
              onSavePlan={placeIds => {
                Alert.alert(
                  'Đã lưu kế hoạch',
                  `Đã thêm ${placeIds.length} địa điểm vào chuyến đi của bạn.`
                );
                // Bỏ các màn lập kế hoạch khỏi lịch sử
                navigation.reset({
                  index: 1,
                  routes: [
                    { name: 'Home' },
                    { name: 'MainTabs', params: { tab: 'trips' } },
                  ],
                });
              }}
            />
          )}
        </Stack.Screen>

        {/* ================= SEARCH & FILTER ================= */}

        <Stack.Screen name="HomeSearchFilter">
          {({ navigation }) => (
            <SearchFilterScreen
              // Nút quay lại
              onBack={() => {
                navigation.goBack();
              }}

              // Nút Áp dụng bộ lọc
              onApplyFilters={() => {
                // Frontend mock: chưa lọc dữ liệu thật
                navigation.goBack();
              }}

              // Nút Profile
              onProfilePress={() => {
                navigation.navigate('MainTabs', {
                  tab: 'profile',
                });
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="MainTabs">
          {({ navigation, route }) => (
            <MainTabsScreen
              key={route.params?.tab ?? 'profile'}
              initialTab={route.params?.tab ?? 'profile'}
              onHomePress={() =>
                navigation.navigate('Home')
              }
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="BusinessOwnerFlow"
          options={{ headerShown: false }}
        >
          {({ navigation }) => (
            <BusinessOwnerNavigator
              initialRoute="Dashboard"
              onExit={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
