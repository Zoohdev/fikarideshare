import { apiClient, STORAGE_KEYS } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse } from '../types/auth';

export interface RegisterData {
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  user_type?: 'rider' | 'driver' | 'both';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface BiometricLoginData {
  credential_id: string;
  signature: string;
  authenticator_data: string;
  client_data_json: string;
}

// Store tokens securely
const storeTokens = async (accessToken: string, refreshToken: string) => {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
    [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
  ]);
};

// Clear tokens
export const clearTokens = async () => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
  ]);
};

// Register new user
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register/', data);
  await storeTokens(response.data.access_token, response.data.refresh_token);
  return response.data;
};

// Login with email/password
export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login/', data);
  await storeTokens(response.data.access_token, response.data.refresh_token);
  return response.data;
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (refreshToken) {
      await apiClient.post('/auth/logout/', { refresh_token: refreshToken });
    }
  } finally {
    await clearTokens();
  }
};

// Get biometric challenge
export const getBiometricChallenge = async (
  credentialId: string
): Promise<{ challenge: string; timeout: number }> => {
  const response = await apiClient.post('/auth/biometric/challenge/', {
    credential_id: credentialId,
  });
  return response.data;
};

// Login with biometrics
export const biometricLogin = async (
  data: BiometricLoginData
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    '/auth/biometric/login/',
    data
  );
  await storeTokens(response.data.access_token, response.data.refresh_token);
  return response.data;
};

// Register biometric credential
export const registerBiometric = async (data: {
  credential_id: string;
  public_key: string;
  device_name?: string;
  device_type?: string;
}): Promise<void> => {
  await apiClient.post('/auth/biometric/register/', data);
};

// Get current user profile
export const getProfile = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/profile/');
  return response.data;
};

// Update profile
export const updateProfile = async (
  data: Partial<User>
): Promise<User> => {
  const response = await apiClient.patch<User>('/auth/profile/', data);
  return response.data;
};

