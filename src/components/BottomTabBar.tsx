import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

// ==================== TYPES ====================

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export type AppTab = 'home' | 'explore' | 'trips' | 'favorites' | 'profile';

type BottomTabBarProps = {
  /** Tab của màn hình hiện tại (được tô sáng) */
  activeTab: AppTab;
  /** Gọi khi bấm vào tab khác tab hiện tại */
  onTabPress: (tab: AppTab) => void;
};

// ==================== TABS ====================

const TABS: {
  id: AppTab;
  label: string;
  icon: IconName;
  activeIcon: IconName;
}[] = [
  { id: 'home', label: 'Trang chủ', icon: 'home-outline', activeIcon: 'home' },
  { id: 'explore', label: 'Khám phá', icon: 'compass-outline', activeIcon: 'compass' },
  { id: 'trips', label: 'Chuyến đi', icon: 'bag-suitcase-outline', activeIcon: 'bag-suitcase' },
  { id: 'favorites', label: 'Yêu thích', icon: 'heart-outline', activeIcon: 'heart' },
  { id: 'profile', label: 'Hồ sơ', icon: 'account-circle-outline', activeIcon: 'account-circle' },
];

const COLORS = {
  activeIcon: '#087E78',
  inactiveIcon: '#88939A',
  activeLabel: '#087E78',
  inactiveLabel: '#65747D',
};

// ==================== COMPONENT ====================

export default function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  return (
    <View
      className="h-[62px] flex-row items-center justify-around border-t border-[#E6E9EE] bg-white px-1"
      accessibilityRole="tablist"
    >
      {TABS.map((tab) => {
        const selected = tab.id === activeTab;

        return (
          <Pressable
            key={tab.id}
            onPress={() => {
              if (!selected) onTabPress(tab.id);
            }}
            className="flex-1 items-center justify-center py-1"
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <MaterialCommunityIcons
              name={selected ? tab.activeIcon : tab.icon}
              size={24}
              color={selected ? COLORS.activeIcon : COLORS.inactiveIcon}
            />

            <Text
              className="mt-0.5 text-[10px]"
              style={{
                color: selected ? COLORS.activeLabel : COLORS.inactiveLabel,
                fontWeight: selected ? '800' : '600',
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
