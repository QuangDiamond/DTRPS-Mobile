import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/featureRoutes';
import { Brand, PrimaryButton, LinkText } from '../../components/common/UI';

type P<K extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, K>;
// React Native requires a static asset path for bundled images.


export default function WelcomeScreen({ navigation }: P<'Welcome'>) {
  return (
    <SafeAreaView className="flex-1 bg-[#F8F8FF]">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View
  className="justify-start items-center bg-[#DDF7F3]"
  style={{ height: 360 }}
>
  <View className="mt-6 bg-white rounded-full px-5 py-2">
    <Text className="text-[#006D67] font-extrabold text-[11px]">
      KHÁM PHÁ VIỆT NAM CÙNG Smart Travel - Ứng dụng du lịch thông minh
    </Text>
  </View>
</View>
        <View className="flex-1 px-5 -mt-9">
          <Brand />
          <View className="bg-white rounded-3xl p-5 min-h-[215px]">
            <Text className="text-[#007F76] text-[11px] font-extrabold">✦ TỐI ƯU & TINH TUYỂN</Text>
            <Text className="text-[#1E3443] text-[21px] font-extrabold mt-3">
              Trải nghiệm du lịch thông minh
            </Text>
            <Text className="text-[#5D6F7B] text-[13px] mt-2 leading-5">
              Tiết kiệm 90% thời gian lên kế hoạch, chỉ dẫn ẩm thực bản địa chuẩn vị và cập nhật giá
              đẹp tránh đông đúc theo thời gian thực.
            </Text>
            <Text className="text-center text-[#007E76] mt-6">● ○ ○</Text>
          </View>
          <View className="flex-row justify-between my-6">
            <Text className="text-[11px] text-[#567782]">✦ Không cần prompt</Text>
            <Text className="text-[11px] text-[#567782]">✦ Tối ưu chi phí</Text>
            <Text className="text-[11px] text-[#567782]">✦ Hỗ trợ offline</Text>
          </View>
          <PrimaryButton title="Bắt đầu ngay" onPress={() => navigation.navigate('Registration')} />
          <LinkText
            title="Đã có tài khoản hành trình? Đăng nhập"
            onPress={() => navigation.navigate('Login')}
          />
          <Pressable
  onPress={() => navigation.navigate('Home')}
  style={{
    paddingVertical: 15,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00796B',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  }}
>
  <Text
    style={{
      color: '#00796B',
      fontSize: 15,
      fontWeight: '600',
    }}
  >
    Tiếp tục không cần tài khoản →
  </Text>
</Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
