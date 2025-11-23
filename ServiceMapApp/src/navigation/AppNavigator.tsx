import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ProvidersListScreen from '../screens/ProvidersListScreen';
import ProviderDetailScreen from '../screens/ProviderDetailScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';

export type RootStackParamList = {
  Home: undefined;
  ProvidersList: { categoryId: string; categoryName: string };
  ProviderDetail: { providerId: string };
  Map: undefined;
  Profile: undefined;
  Login: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'ServiceMap Cyprus 🇨🇾' }}
        />
        <Stack.Screen 
          name="ProvidersList" 
          component={ProvidersListScreen}
          options={{ title: 'Провайдери' }}
        />
        <Stack.Screen 
          name="ProviderDetail" 
          component={ProviderDetailScreen}
          options={{ title: 'Деталі провайдера' }}
        />
        <Stack.Screen 
          name="Map" 
          component={MapScreen}
          options={{ title: 'Карта провайдерів' }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Мій профіль' }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Вхід' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
