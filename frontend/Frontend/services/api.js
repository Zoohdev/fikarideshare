import axios from 'axios';

import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/apiConfig';
import { clearSession, redirectToLogin, refreshSession } from './authSession';
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
          // Shared refresh helper: persists both the new access token AND
          // the rotated refresh token, and de-dupes concurrent refresh calls
          // with app/index.js's cold-start refresh.
          const newAccessToken = await refreshSession();

          // Update the authorization header of the original failed request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Fire off the original request again! The user won't notice a thing.
          return api(originalRequest);

        } catch (refreshError) {
          // The refresh token itself is expired/blacklisted - the user MUST
          // log in again.
          await clearSession();
          redirectToLogin();
          return Promise.reject(refreshError);
        }
      }
  
      // Pass all other non-401 errors down the pipeline
      return Promise.reject(error);
    }
  );
  
  export default api;