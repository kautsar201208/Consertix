import { Platform } from 'react-native';

/**
 * Konfigurasi URL Backend Concertix.
 * - Untuk Web: http://localhost:5000
 * - Untuk HP Fisik via Expo Go (Wi-Fi): http://10.10.64.142:5000
 * - Untuk Android Emulator (AVD): http://10.0.2.2:5000
 */
export const LOCAL_DEV_IP = '10.10.64.175';
export const PORT = '5000';

export const getApiUrl = (): string => {
  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}`;
  }
  // Default untuk Expo Go di jaringan lokal yang sama
  return `http://${LOCAL_DEV_IP}:${PORT}`;
};

export const API_URL = getApiUrl();

