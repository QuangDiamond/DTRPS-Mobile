import React,{useState} from 'react';
import { View, Text, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/featureRoutes';
import { Brand, Field, PrimaryButton, LinkText, validEmail } from '../../components/common/UI';
import { authService } from '../../services/auth';
type Props<K extends keyof RootStackParamList>=NativeStackScreenProps<RootStackParamList,K>;

import { Shell } from '../../components/common/AuthLayout';

export function ForgotPasswordScreen({navigation}:Props<'ForgotPassword'>){const [email,setEmail]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);const submit=async()=>{if(!validEmail(email)){setError('Vui lòng nhập email hợp lệ');return}setError('');setBusy(true);try{await authService.requestPasswordReset(email.trim())}catch(err){Alert.alert('Chưa kết nối backend',(err as Error).message)}finally{setBusy(false)}};return <Shell back={()=>navigation.goBack()}><Brand/><Text className="text-center text-[22px] font-extrabold text-[#19333F]">Quên mật khẩu? 🔐</Text><Text className="text-center text-[12px] text-[#63737E] mt-2 mb-7">Đừng lo lắng! Hãy nhập địa chỉ email đã đăng ký của bạn. Chúng tôi sẽ gửi hướng dẫn kèm liên kết đặt lại mật khẩu an toàn.</Text><View className="bg-white rounded-2xl p-4"><Field label="Địa chỉ Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="hoang.nam@email.com" error={error}/><View className="rounded-xl bg-[#DFF9F5] p-3 mb-4"><Text className="text-[#147C75] text-[12px]">🛡️ Mẹo bảo mật: Liên kết khôi phục sẽ có hiệu lực trong thời gian giới hạn khi backend được kết nối.</Text></View><PrimaryButton title="Gửi link khôi phục" onPress={submit} loading={busy}/></View><View className="bg-white rounded-xl p-4 mt-4"><Text className="text-[13px] font-bold text-[#263C4A]">Nhận mã xác thực qua SMS / Zalo</Text><Text className="text-[11px] text-[#81909B] mt-1">Tùy chọn này sẽ được tích hợp sau.</Text></View><LinkText title="← Quay lại Đăng nhập" onPress={()=>navigation.navigate('Login')}/></Shell>}
