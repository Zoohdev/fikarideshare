import axios from 'axios';
import { Alert } from 'react-native';

import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/apiConfig';
// BASE API
const api = axios.create({
    baseURL: API_BASE_URL, // Your Django server URL
    timeout: 10000, // 10 seconds timeout
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
  api.interceptors.request.use(
    async (config) => {
      const token = await SecureStore.getItemAsync('userToken');
  
      if (token) {
        // Automatically inject the Authorization header to EVERY request
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  //  RESPONSE INTERCEPTOR (Runs AFTER a response/error arrives from backend)
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
  
      // Check if the error is 401 (Unauthorized) and we haven't already tried retrying it
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // Mark this request so we don't loop forever
  
        try {
          // 1. Get the long-lived refresh token from storage
          const refreshToken = await SecureStore.getItemAsync('refreshToken');
          
          if (!refreshToken) {
            throw new Error("No refresh token available");
          }
  
          // 2. Hit the token refresh endpoint (use raw axios to avoid interceptor interference)
          const response = await axios.post(`${API_BASE_URL}/users/token/refresh/`, {
            refresh: refreshToken,
          });
  
          const newAccessToken = response.data.access;
  
          // 3. Save the brand new access token
          await SecureStore.setItemAsync('userToken', newAccessToken);
  
          // 4. Update the authorization header of the original failed request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
  
          // 5. Fire off the original request again! The user won't notice a thing.
          return api(originalRequest);
  
        } catch (refreshError) {
          // If the refresh token itself is expired, the user MUST log in again
          await SecureStore.deleteItemAsync('userToken');
          await SecureStore.deleteItemAsync('refreshToken');
          
          Alert.alert("Session Expired", "Your session has ended. Please log in again.");
          // Redirect to Login Screen logic here...
          return Promise.reject(refreshError);
        }
      }
  
      // Pass all other non-401 errors down the pipeline
      return Promise.reject(error);
    }
  );
  
  export default api;