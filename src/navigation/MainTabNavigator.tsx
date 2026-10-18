import React from 'react';
import {Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {MainTabParams} from '../types';
import {HomeScreen} from '../screens/home/HomeScreen';
import {DiscoveryScreen} from '../screens/discovery/DiscoveryScreen';
import {colors} from '../constants/theme';
import {StitchDirectory} from '../stitch/StitchScreens';
const Tab=createBottomTabNavigator<MainTabParams>();
export function MainTabNavigator(){return <Tab.Navigator screenOptions={{headerShown:false,tabBarActiveTintColor:colors.primary,tabBarStyle:{height:65,paddingBottom:8,paddingTop:6},tabBarLabelStyle:{fontSize:12,fontWeight:'700'}}}><Tab.Screen name="Home" component={HomeScreen} options={{tabBarLabel:'Trang chủ',tabBarIcon:({color})=><Text style={{color,fontSize:23}}>⌂</Text>}}/><Tab.Screen name="Discovery" component={DiscoveryScreen} options={{tabBarLabel:'Khám phá',tabBarIcon:({color})=><Text style={{color,fontSize:22}}>⌕</Text>}}/><Tab.Screen name="StitchDirectory" component={StitchDirectory} options={{tabBarLabel:"Màn hình",tabBarIcon:({color})=><Text style={{color,fontSize:22}}>▦</Text>}}/></Tab.Navigator>}
