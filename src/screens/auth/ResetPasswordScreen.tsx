import React,{useState} from 'react';
import { View, Text, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/featureRoutes';
import { Brand, Field, PrimaryButton, LinkText, validPassword } from '../../components/common/UI';
import { authService } from '../../services/auth';
type Props<K extends keyof RootStackParamList>=NativeStackScreenProps<RootStackParamList,K>;

import { Shell } from '../../components/common/AuthLayout';

export function ResetPasswordScreen({navigation,route}:Props<'ResetPassword'>){const [token,setToken]=useState(route.params?.token??''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[error,setError]=useState('');const submit=async()=>{if(!token.trim()){setError('Cần mã khôi phục từ email');return}if(!validPassword(password)){setError('Mật khẩu cần 8 ký tự, chữ hoa, chữ thường và số');return}if(password!==confirm){setError('Xác nhận mật khẩu không khớp');return}setError('');try{await authService.resetPassword(token,password)}catch(err){Alert.alert('Chưa kết nối backend',(err as Error).message)}};return <Shell back={()=>navigation.goBack()}><Brand/><Text className="text-[22px] text-center font-extrabold text-[#183943] mb-2">Đặt lại mật khẩu</Text><Text className="text-center text-[#72828E] text-[12px] mb-6">Nhập mã khôi phục nhận qua email và tạo mật khẩu mới.</Text><View className="bg-white p-4 rounded-2xl"><Field label="Mã khôi phục" value={token} onChangeText={setToken} placeholder="Nhập mã từ email"/><Field label="Mật khẩu mới" value={password} onChangeText={setPassword} secure/><Field label="Xác nhận mật khẩu mới" value={confirm} onChangeText={setConfirm} secure/>{error?<Text className="text-red-600 text-xs mb-3">{error}</Text>:null}<PrimaryButton title="Đặt lại mật khẩu" onPress={submit}/></View><LinkText title="Quay lại đăng nhập" onPress={()=>navigation.navigate('Login')}/></Shell>}
