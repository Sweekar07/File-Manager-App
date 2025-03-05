// src/App.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './components/HomeScreen';
import CategoryScreen from './components/CategoryScreen';

// Type Definitions
type RootStackParamList = {
  HomeScreen: undefined;
  CategoryScreen: { 
    title: 'Photos' | 'Audio' | 'Videos' | 'Documents' | 'APKs' | 'Archives';
  };
};

// Create Stack Navigator
const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'File Manager' }} />
            <Stack.Screen name="CategoryScreen" component={CategoryScreen} options={({ route }) => ({ title: route.params.title })} />
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

export default App;
