import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Konfigurasi URL Backend Concertix.
 * - Untuk Web: http://localhost:5000
 * - Untuk HP Fisik via Expo Go (Wi-Fi): Otomatis membaca IP host atau fallback ke IP Wi-Fi komputer
 * - Untuk Android Emulator (AVD): http://10.0.2.2:5000 atau IP lokal
 */
export const LOCAL_DEV_IP = '10.10.64.185';
export const PORT = '5000';

export const getApiUrl = (): string => {
  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}`;
  }

  // 1. Otomatis deteksi IP komputer tempat Expo CLI berjalan
  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:${PORT}`;
    }
  }

  // 2. Fallback IP Wi-Fi lokal
  return `http://${LOCAL_DEV_IP}:${PORT}`;
};

export const API_URL = getApiUrl();


