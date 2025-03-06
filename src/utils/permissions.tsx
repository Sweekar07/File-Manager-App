// src/utils/permissions.ts

import { Platform, Alert, Linking } from 'react-native';
import { request, PERMISSIONS, RESULTS, check } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const PERMISSIONS_REQUESTED_KEY = 'permissions_already_requested';
const PERMISSIONS_STATUS_KEY = 'permissions_status';

// Get cached permission status
export const getCachedPermissionStatus = async (): Promise<boolean | null> => {
  try {
    const value = await AsyncStorage.getItem(PERMISSIONS_STATUS_KEY);
    if (value === null) return null;
    return value === 'true';
  } catch (error) {
    console.error('Error getting cached permission status:', error);
    return null;
  }
};

// Cache the permission status
export const cachePermissionStatus = async (granted: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(PERMISSIONS_STATUS_KEY, granted ? 'true' : 'false');
  } catch (error) {
    console.error('Error caching permission status:', error);
  }
};

// Check if permissions were already requested
export const hasRequestedPermissions = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(PERMISSIONS_REQUESTED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking if permissions were requested:', error);
    return false;
  }
};

// Mark permissions as requested
export const markPermissionsAsRequested = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(PERMISSIONS_REQUESTED_KEY, 'true');
  } catch (error) {
    console.error('Error marking permissions as requested:', error);
  }
};

// The actual permission checking logic
const doFullPermissionCheck = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    if (Platform.Version >= 33) {
      // Android 13+ (API 33+)
      const permissions = [
        PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
        PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
        PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
      ];
      const results = await Promise.all(permissions.map((permission) => check(permission)));
      return results.every(result => 
        result === RESULTS.GRANTED || result === RESULTS.LIMITED
      );
    } else if (Platform.Version >= 29) {
      // Android 10+ (API 29+)
      const result = await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
    } else {
      // Earlier Android versions
      const readResult = await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      const writeResult = await check(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
      return (readResult === RESULTS.GRANTED || readResult === RESULTS.LIMITED) && 
             (writeResult === RESULTS.GRANTED || writeResult === RESULTS.LIMITED);
    }
  } catch (err) {
    console.warn('Permission check failed:', err);
    return false;
  }
};

// Function to verify and update permissions in background
const verifyAndUpdatePermissions = async (): Promise<void> => {
  const actualStatus = await doFullPermissionCheck();
  await cachePermissionStatus(actualStatus);
};

// Helper to check current permission status
export const checkPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    // First check cached status for a quick response
    const cachedStatus = await getCachedPermissionStatus();
    if (cachedStatus !== null) {
      // If we have a cached status, use it, but verify in background
      setTimeout(() => {
        verifyAndUpdatePermissions();
      }, 0);
      return cachedStatus;
    }

    // If no cached status, do a full check
    const result = await doFullPermissionCheck();
    await cachePermissionStatus(result);
    return result;
  } catch (err) {
    console.warn('Permission check failed:', err);
    return false;
  }
};

export const requestAllFilePermissions = async (): Promise<boolean> => {
  // Only proceed with permission requests on Android
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    // First check if permissions are already granted to avoid showing the prompt
    const alreadyGranted = await doFullPermissionCheck();
    if (alreadyGranted) {
      // If already granted, mark as requested and return true
      await markPermissionsAsRequested();
      await cachePermissionStatus(true);
      return true;
    }

    // Check if we already requested permissions before
    const alreadyRequested = await hasRequestedPermissions();
    if (alreadyRequested) {
      // If already requested before but not granted, just return current status
      await cachePermissionStatus(alreadyGranted);
      return alreadyGranted;
    }

    let finalResult = false;

    if (Platform.Version >= 33) {
      // Android 13+ (API 33+) uses the new granular permissions
      const permissions = [
        PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
        PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
        PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
      ];
      const results = await Promise.all(permissions.map((permission) => request(permission)));
      
      // Mark that we've requested permissions
      await markPermissionsAsRequested();
      
      finalResult = results.every(result => result === RESULTS.GRANTED);
      if (!finalResult) {
        showPermissionAlert();
      }
    } else if (Platform.Version >= 29) {
      // Android 10+ (API 29+) - we need READ_EXTERNAL_STORAGE
      const granted = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      
      // Mark that we've requested permissions
      await markPermissionsAsRequested();
      
      finalResult = granted === RESULTS.GRANTED;
      if (!finalResult) {
        showPermissionAlert();
      }
    } else {
      // Earlier Android versions - need READ and WRITE
      const readGranted = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      const writeGranted = await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
      
      // Mark that we've requested permissions
      await markPermissionsAsRequested();
      
      finalResult = readGranted === RESULTS.GRANTED && writeGranted === RESULTS.GRANTED;
      if (!finalResult) {
        showPermissionAlert();
      }
    }

    // Cache the final result
    await cachePermissionStatus(finalResult);
    return finalResult;
  } catch (err) {
    console.warn('Permission request failed:', err);
    await cachePermissionStatus(false);
    return false;
  }
};

const showPermissionAlert = () => {
  Alert.alert(
    'Permission Required',
    'Storage permission is needed to access your files. Please enable it in the app settings.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() }
    ]
  );
};
