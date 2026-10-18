import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {RootStackParams} from '../types';
import {LoginScreen} from '../screens/auth/LoginScreen';
import {RegisterScreen} from '../screens/auth/RegisterScreen';
import {SearchFilterScreen} from '../screens/discovery/SearchFilterScreen';
import {MainTabNavigator} from './MainTabNavigator';
import {StitchDetail} from '../stitch/StitchScreens';
const Stack=createNativeStackNavigator<RootStackParams>();
export function RootNavigator(){return <Stack.Navigator initialRouteName="Login" screenOptions={{headerShown:false}}><Stack.Screen name="Login" component={LoginScreen}/><Stack.Screen name="Register" component={RegisterScreen}/><Stack.Screen name="Main" component={MainTabNavigator}/><Stack.Screen name="Filters" component={SearchFilterScreen}/><Stack.Screen name="StitchDetail" component={StitchDetail}/></Stack.Navigator>}
