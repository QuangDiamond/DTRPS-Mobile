import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { FilterProvider } from './src/hooks/useFilterStore';
export default function App() { return <FilterProvider><NavigationContainer><StatusBar style="dark" /><RootNavigator /></NavigationContainer></FilterProvider>; }
