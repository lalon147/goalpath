import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Where the access and refresh tokens live.
 *
 * AsyncStorage is unencrypted: on a rooted or jailbroken device, and in some
 * device backups, its contents are readable by anything that can reach the app
 * sandbox. A refresh token is good for 30 days, so that is a long-lived key to
 * leave lying in the clear. SecureStore is backed by the iOS Keychain and
 * Android Keystore instead.
 *
 * Tokens written by earlier versions are still in AsyncStorage. Reads fall back
 * to it and migrate what they find, so upgrading does not sign anyone out — the
 * old copy is removed once the value is safely in SecureStore.
 *
 * Expo's web target has no SecureStore. There it degrades to AsyncStorage,
 * which is what the app already used, rather than failing to start.
 */

const KEYS = ['accessToken', 'refreshToken'];
const useSecureStore = Platform.OS !== 'web';

export const setToken = async (key, value) => {
  if (!useSecureStore) return AsyncStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
};

export const getToken = async (key) => {
  if (!useSecureStore) return AsyncStorage.getItem(key);

  const secure = await SecureStore.getItemAsync(key);
  if (secure !== null) return secure;

  // Nothing in the keychain yet: this is either a signed-out app or a session
  // created before the move. Migrate rather than treating it as signed out.
  const legacy = await AsyncStorage.getItem(key);
  if (legacy !== null) {
    await SecureStore.setItemAsync(key, legacy);
    await AsyncStorage.removeItem(key);
    return legacy;
  }

  return null;
};

export const clearTokens = async () => {
  // Clears both stores. A sign-out has to remove any legacy copy too, or the
  // migration path above would quietly restore the session on the next launch.
  await AsyncStorage.multiRemove(KEYS);
  if (!useSecureStore) return;
  await Promise.all(KEYS.map((k) => SecureStore.deleteItemAsync(k)));
};
