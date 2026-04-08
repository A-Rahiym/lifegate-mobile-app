import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'lifegate_token';
const REFRESH_TOKEN_KEY = 'lifegate_refresh_token';

/**
 * Cache the result after the first probe so we don't pay the try/catch cost
 * on every call. null = not yet tested, true/false = result of probe.
 */
let secureStoreWorks: boolean | null = null;

/**
 * Probe SecureStore by actually calling setItemAsync with an empty string.
 * This is the only reliable way to detect whether the native layer supports
 * the v15 API (setItemAsync/getItemAsync) on the current Expo Go runtime.
 * Older Expo Go versions throw "setValueWithKeyAsync is not a function".
 */
async function probeSecureStore(): Promise<boolean> {
  if (secureStoreWorks !== null) return secureStoreWorks;
  try {
    await SecureStore.setItemAsync('__probe__', '1');
    await SecureStore.deleteItemAsync('__probe__');
    secureStoreWorks = true;
  } catch {
    secureStoreWorks = false;
  }
  return secureStoreWorks;
}

async function storeSet(key: string, value: string): Promise<void> {
  if (await probeSecureStore()) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function storeGet(key: string): Promise<string | null> {
  if (await probeSecureStore()) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

async function storeRemove(key: string): Promise<void> {
  if (await probeSecureStore()) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

// ─── Access token ─────────────────────────────────────────────────────────────
// NOTE: The access token is intentionally kept in-memory only (Zustand state +
// api.ts module variable). These functions are kept for legacy session restore
// but should not be used for new write paths.

export async function saveToken(token: string): Promise<void> {
  await storeSet(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return storeGet(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await storeRemove(TOKEN_KEY);
}

/**
 * Returns true only when a token exists AND its exp claim is
 * more than 10 seconds in the future. A missing or malformed
 * JWT is treated as invalid.
 */
export async function isTokenValid(): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 > Date.now() + 10_000;
  } catch {
    return false;
  }
}

// ─── Refresh token ────────────────────────────────────────────────────────────

export async function saveRefreshToken(token: string): Promise<void> {
  await storeSet(REFRESH_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return storeGet(REFRESH_TOKEN_KEY);
}

export async function removeRefreshToken(): Promise<void> {
  await storeRemove(REFRESH_TOKEN_KEY);
}
