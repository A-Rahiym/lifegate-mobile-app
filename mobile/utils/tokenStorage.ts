import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'lifegate_token';

/**
 * Returns true if expo-secure-store is available on this runtime.
 * Expo Go on older SDK versions may not support expo-secure-store v15
 * (setValueWithKeyAsync not a function). Fall back to AsyncStorage in that case.
 */
function isSecureStoreAvailable(): boolean {
  try {
    return (
      typeof SecureStore.setItemAsync === 'function' &&
      typeof SecureStore.getItemAsync === 'function' &&
      typeof SecureStore.deleteItemAsync === 'function'
    );
  } catch {
    return false;
  }
}

export async function saveToken(token: string): Promise<void> {
  if (isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }
}

export async function getToken(): Promise<string | null> {
  if (isSecureStoreAvailable()) {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  if (isSecureStoreAvailable()) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function isTokenValid(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}
