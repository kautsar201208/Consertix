import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// In-memory fallback jika storage native tidak tersedia
const memoryStorage = new Map<string, string>();

/**
 * Storage adapter yang aman untuk Web, Expo Go, Android, dan iOS.
 * Menghindari error "Native module is null, cannot access legacy storage".
 */
export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
          return;
        }
      } else {
        const isAvailable = await SecureStore.isAvailableAsync().catch(() => false);
        if (isAvailable) {
          await SecureStore.setItemAsync(key, value);
          return;
        }
      }
    } catch (err) {
      console.warn(`[storage] setItem fallback to memory for key "${key}":`, err);
    }
    memoryStorage.set(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } else {
        const isAvailable = await SecureStore.isAvailableAsync().catch(() => false);
        if (isAvailable) {
          return await SecureStore.getItemAsync(key);
        }
      }
    } catch (err) {
      console.warn(`[storage] getItem fallback to memory for key "${key}":`, err);
    }
    return memoryStorage.get(key) ?? null;
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          return;
        }
      } else {
        const isAvailable = await SecureStore.isAvailableAsync().catch(() => false);
        if (isAvailable) {
          await SecureStore.deleteItemAsync(key);
          return;
        }
      }
    } catch (err) {
      console.warn(`[storage] removeItem fallback to memory for key "${key}":`, err);
    }
    memoryStorage.delete(key);
  },
};

