import './global.css';

import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import ProfileScreen from './src/screens/profile/ProfileScreen';

import EditProfileScreen, {
  defaultProfile,
  type EditableProfile,
} from './src/screens/profile/EditProfileScreen';

import ExploreScreen from './src/screens/explore/ExploreScreen';

import { type AppTab } from './src/components/BottomTabBar';

import PlaceDetailsScreen from './src/screens/explore/PlaceDetailsScreen';

import FavoritesScreen from './src/screens/favorites/FavoritesScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('profile');

  const [isEditing, setIsEditing] = useState(false);

  // Địa điểm đang xem chi tiết (null = đang ở danh sách Khám phá)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(
    null
  );

  // Dữ liệu mẫu: vài địa điểm đã lưu sẵn để màn Yêu thích có nội dung
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

  const [profile, setProfile] = useState<EditableProfile>(
    defaultProfile
  );

  // Chỉ có màn Hồ sơ, Khám phá và Yêu thích, các tab khác chưa làm
  const handleTabPress = (tab: AppTab) => {
    if (tab === 'profile' || tab === 'explore' || tab === 'favorites') {
      setSelectedPlaceId(null);
      setActiveTab(tab);
    } else {
      Alert.alert('Điều hướng', 'Chức năng đang được phát triển.');
    }
  };

  // Hiển thị màn Khám phá / Yêu thích (+ màn Chi tiết đè lên trên để giữ trạng thái danh sách)
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
              onToggleFavorite={() => toggleFavorite(selectedPlaceId)}
              onBack={() => setSelectedPlaceId(null)}
              onProfilePress={() => handleTabPress('profile')}
            />
          </View>
        )}
      </View>
    );
  }

  // Hiển thị màn Chỉnh sửa hồ sơ
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

  // Hiển thị màn Hồ sơ cá nhân
  return (
    <ProfileScreen
      profileName={profile.name}
      profileEmail={profile.email}
      onTabPress={handleTabPress}
      onEditProfilePress={() => {
        setIsEditing(true);
      }}
    />
  );
}
