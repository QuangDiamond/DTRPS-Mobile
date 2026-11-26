import './global.css';

// Chỉ nạp 5 độ đậm đang dùng (import theo từng tệp để bundle không kèm cả bộ font)
import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular';
import { BeVietnamPro_500Medium } from '@expo-google-fonts/be-vietnam-pro/500Medium';
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold';
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold';
import { BeVietnamPro_800ExtraBold } from '@expo-google-fonts/be-vietnam-pro/800ExtraBold';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthProvider';
import { FavoritesProvider } from './src/auth/FavoritesProvider';
import { NotificationsProvider } from './src/auth/NotificationsProvider';
import LiveNotificationBanner from './src/components/LiveNotificationBanner';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme';

/**
 * App du khách SmartTravel — dùng chung tài khoản và Backend với web du khách (cổng TRAVELLER).
 * Mobile không có khu Đối tác / Quản trị. Font Be Vietnam Pro giống web.
 */
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
  });

  // Chờ font (lỗi tải font thì vẫn mở app với font hệ thống)
  if (!fontsLoaded && !fontError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationsProvider>
          <NavigationContainer>
            <FavoritesProvider>
              <StatusBar style="dark" />
              <RootNavigator />
              <LiveNotificationBanner />
            </FavoritesProvider>
          </NavigationContainer>
        </NotificationsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
