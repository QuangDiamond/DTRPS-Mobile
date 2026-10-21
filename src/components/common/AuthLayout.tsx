import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
export function Shell({ children, back }: { children: React.ReactNode; back?: () => void }) {
  return (
    <SafeAreaView className="flex-1 bg-[#F8F8FF]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 25,
            paddingTop: 22,
            paddingBottom: 28,
          }}
        >
          {back && (
            <Pressable
              onPress={back}
              accessibilityLabel="Quay lại"
              className="h-10 w-10 rounded-full bg-white items-center justify-center mb-6"
            >
              <Icon name="chevron-left" size={24} color="#1E3D48" />
            </Pressable>
          )}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Social() {
  return (
    <View className="mt-4">
      <Text className="text-center text-[#89939C] text-[11px] mb-3">HOẶC TIẾP TỤC VỚI</Text>
      <View className="flex-row gap-3">
        {['Google', 'Apple ID'].map((x) => (
          <Pressable
            key={x}
            onPress={() => Alert.alert('Chưa kết nối', `Đăng nhập ${x} sẽ được tích hợp sau.`)}
            className="flex-1 bg-white border border-[#E9ECF2] rounded-xl py-3 items-center"
          >
            <Text className="text-[#293A48] text-[12px] font-semibold">{x}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
