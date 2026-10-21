import React from 'react';
import { Text, View } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

// Logo + tên SmartTravel dùng chung cho header các màn (theo màn Home)

const COLORS = {
  text: '#131B2E',
  teal: '#008378',
  primary: '#00685F',
};

type AppLogoProps = {
  /** Dòng chữ nhỏ dưới tên app */
  subtitle?: string;
};

export default function AppLogo({
  subtitle = 'VIETNAM AI PLANNER',
}: AppLogoProps) {
  return (
    <View className="flex-row items-center">
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-600">
        <MaterialCommunityIcons name="earth" size={24} color="white" />
      </View>

      <View className="ml-2">
        <Text
          className="text-[16px] font-extrabold"
          style={{ color: COLORS.text }}
        >
          Smart<Text style={{ color: COLORS.teal }}>Travel</Text>
        </Text>

        <Text
          className="text-[9px] font-semibold tracking-widest"
          style={{ color: COLORS.primary }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
