/**
 * AsyncStorage-based persistence service.
 * Provides typed get/set/remove operations with JSON serialization.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Save a value to AsyncStorage with JSON serialization.
 */
export async function saveData<T>(key: string, value: T): Promise<void> {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`[Storage] Error saving ${key}:`, error);
  }
}

/**
 * Load a value from AsyncStorage with JSON parsing.
 * Returns null if the key doesn't exist.
 */
export async function loadData<T>(key: string): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
  } catch (error) {
    console.error(`[Storage] Error loading ${key}:`, error);
    return null;
  }
}

/**
 * Remove a value from AsyncStorage.
 */
export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`[Storage] Error removing ${key}:`, error);
  }
}

/**
 * Clear all TaskFlow data from AsyncStorage.
 */
export async function clearAllData(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const taskflowKeys = keys.filter((k) => k.startsWith('@taskflow/'));
    await AsyncStorage.multiRemove(taskflowKeys);
  } catch (error) {
    console.error('[Storage] Error clearing all data:', error);
  }
}
