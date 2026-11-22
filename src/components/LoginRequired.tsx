import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRootNav } from '../navigation/hooks';
import { colors } from '../theme';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/States';

/** Màn cần đăng nhập khi khách chưa đăng nhập (giống RequireClientLogin của web) */
export function LoginRequired({ title, message }: { title: string; message: string }) {
  const navigation = useRootNav();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
      <View className="p-4">
        <EmptyState
          icon="lock-outline"
          title={title}
          message={message}
          action={
            <View className="gap-2.5">
              <Button title="Đăng nhập" onPress={() => navigation.navigate('Login')} />
              <Button title="Tạo tài khoản" variant="secondary" onPress={() => navigation.navigate('Register')} />
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
