// src/utils/permissions.ts

import { Platform, Alert, Linking } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      if (Platform.Version >= 33) {
        const permissions = [
          PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
          PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
          PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        ];
        const results = await Promise.all(permissions.map((permission) => request(permission)));

        if (results.some(result => result === RESULTS.GRANTED)) {
          return true;
        } else {
          Alert.alert(
            'Permission Required',
            'Storage permission has been denied. Please enable it manually from the app settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return false;
        }
      } else {
        const granted = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
        if (granted === RESULTS.GRANTED) {
          return true;
        } else {
          Alert.alert(
            'Permission Required',
            'Storage permission has been denied. Please enable it manually from the app settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return false;
        }
      }
    } catch (err) {
      console.warn('Permission request failed:', err);
      return false;
    }
  } else {
    return true;
  }
};
