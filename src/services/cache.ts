import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export const cache = {
  async set<T>(key: string, data: T): Promise<void> {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(item));
  },

  async get<T>(key: string): Promise<T | null> {
    const item = await AsyncStorage.getItem(key);
    if (!item) return null;

    const { data, timestamp }: CacheItem<T> = JSON.parse(item);
    const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

    if (isExpired) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return data;
  },

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  },
}; 