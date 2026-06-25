import React, { createContext, useState, useContext, useCallback } from 'react';
import api from '../../services/api';

// 1. Initialize the Context
const ProfileContext = createContext(null);

// 2. Build the Wrapper Component
export const ProfileProvider = ({ children }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Global fetch method that can be triggered from ANY screen
  const fetchProfileDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile/');
      
      if (response.status === 200 && response.data) {
        setProfileData(response.data);
        return response.data;
      }
    } catch (error) {
      console.log("❌ Context Profile Fetch Error:", error.response?.status || error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Method to clear profile state completely on manual logouts
  const clearProfileData = useCallback(() => {
    setProfileData(null);
  }, []);

  return (
    <ProfileContext.Provider value={{ profileData, setProfileData, fetchProfileDetails, loading, clearProfileData }}>
      {children}
    </ProfileContext.Provider>
  );
};

// 3. Create a custom hook for super easy consumption anywhere
export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};