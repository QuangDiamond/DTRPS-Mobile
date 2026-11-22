import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import type { RootStackParamList } from './types';

export type RootNav = NativeStackNavigationProp<RootStackParamList>;

/** Điều hướng tới mọi màn của stack gốc (dùng được cả trong tab) */
export function useRootNav(): RootNav {
  return useNavigation<RootNav>();
}

/**
 * Chạy thao tác cần đăng nhập; khách chưa đăng nhập thì chuyển sang màn Đăng nhập
 * (giống RequireClientLogin của web).
 */
export function useRequireLogin() {
  const { user } = useAuth();
  const navigation = useRootNav();
  return useCallback(
    (action: () => void) => {
      if (user) action();
      else navigation.navigate('Login', { notice: 'Đăng nhập để dùng tính năng này.' });
    },
    [user, navigation],
  );
}
