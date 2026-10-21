
import './global.css';

import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import ProfileScreen from './src/screens/profile/ProfileScreen';

import EditProfileScreen, {
  defaultProfile,
  type EditableProfile,
} from './src/screens/profile/EditProfileScreen';

// MỚI: Import màn Settings
import SettingsScreen from './src/screens/profile/SettingsScreen';

import ExploreScreen from './src/screens/explore/ExploreScreen';

import { type AppTab } from './src/components/BottomTabBar';

import PlaceDetailsScreen from './src/screens/explore/PlaceDetailsScreen';

import FavoritesScreen from './src/screens/favorites/FavoritesScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('profile');

  const [isEditing, setIsEditing] = useState(false);

  // MỚI: Trạng thái mở màn Settings
  const [isSettings, setIsSettings] = useState(false);

  // Địa điểm đang xem chi tiết
  const [selectedPlaceId, setSelectedPlaceId] =
    useState<string | null>(null);

  // Danh sách địa điểm yêu thích
  const [favorites, setFavorites] = useState<string[]>([
    'ba-na',
    'hoi-an',
    'ha-long',
  ]);

  const toggleFavorite = (placeId: string) => {
    setFavorites((previous) =>
      previous.includes(placeId)
        ? previous.filter((id) => id !== placeId)
        : [...previous, placeId]
    );
  };

  // Thông tin hồ sơ hardcode
  const [profile, setProfile] =
    useState<EditableProfile>(defaultProfile);

  // Chuyển tab
  const handleTabPress = (tab: AppTab) => {
    if (
      tab === 'profile' ||
      tab === 'explore' ||
      tab === 'favorites'
    ) {
      setSelectedPlaceId(null);
      setActiveTab(tab);

      // MỚI: Đóng các màn phụ khi chuyển tab
      setIsSettings(false);
      setIsEditing(false);
    } else {
      Alert.alert(
        'Điều hướng',
        'Chức năng đang được phát triển.'
      );
    }
  };

  // ==================== EXPLORE / FAVORITES ====================

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

  // ==================== EDIT PROFILE ====================

  if (isEditing) {
    return (
      <EditProfileScreen
        initialProfile={profile}
        onBack={() => {
          setIsEditing(false);
        }}
        onSave={(updatedProfile) => {
          setProfile(updatedProfile);
          setIsEditing(false);
        }}
      />
    );
  }

  // ==================== SETTINGS SCREEN ====================
  // MỚI: Toàn bộ phần này

  if (isSettings) {
    return (
      <SettingsScreen
        onBackPress={() => {
          setIsSettings(false);
        }}

        onEditProfilePress={() => {
          setIsEditing(true);
        }}

        onMyTripsPress={() => {
          handleTabPress('trips');
        }}

        onFavoritePlacesPress={() => {
          handleTabPress('favorites');
        }}

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

        onTabPress={(tab) => {
          // SettingsScreen dùng tên tab khác BottomTabBar
          if (tab === 'favorite') {
            handleTabPress('favorites');
          } else if (tab === 'trip') {
            handleTabPress('trips');
          } else {
            handleTabPress(tab);
          }
        }}
      />
    );
  }

  // ==================== PROFILE SCREEN ====================

  return (
    <ProfileScreen
      profileName={profile.name}
      profileEmail={profile.email}
      onTabPress={handleTabPress}
      onEditProfilePress={() => {
        setIsEditing(true);
      }}

      // MỚI: Nhấn Cài đặt để mở SettingsScreen
      onSettingsPress={() => {
        setIsSettings(true);
      }}
    />
  );
}
