
import './global.css';

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

import ExploreScreen from './src/screens/explore/ExploreScreen';
import PlaceDetailsScreen from './src/screens/explore/PlaceDetailsScreen';
import FavoritesScreen from './src/screens/favorites/FavoritesScreen';

import type { AppTab } from './src/components/BottomTabBar';
import type { RootStackParamList } from './src/types/featureRoutes';

type AppRoutes = RootStackParamList & {
  MainTabs: { tab?: AppTab } | undefined;
  BusinessOwnerFlow: undefined;
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
      tab === 'favorites'
    ) {
      setSelectedPlaceId(null);
      setIsEditing(false);
      setIsSettings(false);
      setActiveTab(tab);
      return;
    }

    Alert.alert(
      'Điều hướng',
      'Chức năng đang được phát triển.'
    );
  };

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
    />
  );
}

export default function App() {
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
              onPartnerPress={() =>
                navigation.navigate('BusinessOwnerFlow')
              }
              onTabPress={tab => {
                if (tab === 'home') return;

                if (tab === 'trips') {
                  Alert.alert(
                    'Chuyến đi',
                    'Chức năng đang được phát triển.'
                  );
                  return;
                }

                navigation.navigate('MainTabs', { tab });
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
