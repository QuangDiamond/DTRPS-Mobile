
import './global.css';

import React, { useState } from 'react';

import ProfileScreen from './src/screens/profile/ProfileScreen';

import EditProfileScreen, {
  defaultProfile,
  type EditableProfile,
} from './src/screens/profile/EditProfileScreen';

export default function App() {
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState<EditableProfile>(
    defaultProfile
  );

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
      onEditProfilePress={() => {
        setIsEditing(true);
      }}
    />
  );
}
