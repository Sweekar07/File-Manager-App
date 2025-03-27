// src/App.tsx

import React, {useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView, Text } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TrackPlayer, {Capability, } from 'react-native-track-player';
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

export async function setupPlayer() {
  try {
    await TrackPlayer.getActiveTrackIndex();
    return true;
  } catch {
    try {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.Stop,
          Capability.SeekTo,
          // Capability.JumpForward,
          // Capability.JumpBackward,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.Stop,
        ],
        progressUpdateEventInterval: 1,
        android: {
          alwaysPauseOnInterruption: true,
        },
      });
      return true;
    } catch (setupError) {
      console.error('Error setting up TrackPlayer:', setupError);
      return false;
    }
  }
}

const App = () => {

  const [isPlayerSetup, setIsPlayerSetup] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    const initializePlayer = async () => {
      try {
        const isSetup = await setupPlayer();
        setIsPlayerSetup(isSetup);
        if (!isSetup) {
          setSetupError('Failed to initialize audio player');
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setSetupError('Unexpected error during player setup');
      }
    };

    initializePlayer();
  }, []);

  // Simple error handling component
  if (setupError) {
    return (
      <SafeAreaProvider>
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 50 }}>
          {setupError}
        </Text>
      </SafeAreaProvider>
    );
  }

  if (!isPlayerSetup) {
    // return null; // or a loading indicator
    return (
      <SafeAreaProvider>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>
          Initializing player...
        </Text>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {/* <GestureHandlerRootView style={{ flex: 1 }}> */}
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen 
              name="HomeScreen" 
              component={HomeScreen} 
              options={{ title: 'File Manager' }} 
            />
            <Stack.Screen 
              name="CategoryScreen" 
              component={CategoryScreen} 
              options={({ route }) => ({ title: route.params.title })} 
            />
          </Stack.Navigator>
        </NavigationContainer>
      {/* </GestureHandlerRootView> */}
    </SafeAreaProvider>
  );
};

export default App;
