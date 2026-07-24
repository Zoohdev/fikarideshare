import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/apiConfig';

// Single source of truth for the "call /token/refresh/, persist the
// (rotated) tokens, and handle failure" logic - previously duplicated
// between app/index.js's splash bootstrap and services/api.js's response
// interceptor.

// Concurrent callers (a cold-start refresh in index.js racing a reactive
// 401 refresh in api.js) must await the same in-flight request instead of
// firing two /token/refresh/ calls - ROTATE_REFRESH_TOKENS means each call
// invalidates the previous refresh token, so a second parallel call would
// silently strand whichever caller's response loses the race.
let inFlightRefresh = null;

export async function refreshSession() {
  if (!inFlightRefresh) {
    inFlightRefresh = performRefresh().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

async function performRefresh() {
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  // Raw axios, not the `api` instance - avoids re-entering its interceptors.
  const response = await axios.post(`${API_BASE_URL}/users/token/refresh/`, {
    refresh: refreshToken,
  });

  const { access, refresh } = response.data;
  await SecureStore.setItemAsync('userToken', access);
  // ROTATE_REFRESH_TOKENS is on server-side - the old refresh token is
  // blacklisted the moment this response is issued, so the new one must be
  // persisted too or the 90-day sliding window stops sliding after this call.
  if (refresh) {
    await SecureStore.setItemAsync('refreshToken', refresh);
  }

  return access;
}

export async function clearSession() {
  await SecureStore.deleteItemAsync('userToken');
  await SecureStore.deleteItemAsync('refreshToken');
  await AsyncStorage.multiRemove(['userData', 'userId', 'token']);
}

export function redirectToLogin() {
  router.replace('/auth/loginScreen');
}
