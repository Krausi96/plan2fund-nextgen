// User Context for Profile Management and State
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, validateUserProfile } from '@/lib/schemas/userProfile';
import featureFlags from '@/lib/featureFlags';
import analytics from '@/lib/analytics';

interface UserContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  setUserProfile: (profile: UserProfile) => void;
  clearUserProfile: () => void;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      
      // Check for existing profile in localStorage
      const storedProfile = localStorage.getItem('pf_user_profile');
      if (storedProfile) {
        try {
          const profile = JSON.parse(storedProfile);
          const validatedProfile = validateUserProfile(profile);
          
          if (validatedProfile) {
            setUserProfileState(validatedProfile);
            setHasCompletedOnboarding(true);
            
            // Set feature flags context
            featureFlags.setUserContext(validatedProfile.segment, validatedProfile.id);
            
            // Set analytics user ID
            analytics.setUserId(validatedProfile.id);
            
            // Refresh profile from server
            await refreshProfileFromServer(validatedProfile.id);
          }
        } catch (parseError) {
          console.error('Error parsing stored profile:', parseError);
          // Clear invalid profile from localStorage
          localStorage.removeItem('pf_user_profile');
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfileFromServer = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile) {
          setUserProfileState(data.profile);
          localStorage.setItem('pf_user_profile', JSON.stringify(data.profile));
        }
      }
    } catch (error) {
      console.error('Error refreshing profile from server:', error);
    }
  };

  const setUserProfile = (profile: UserProfile) => {
    setUserProfileState(profile);
    setHasCompletedOnboarding(true);
    
    // Store in localStorage
    localStorage.setItem('pf_user_profile', JSON.stringify(profile));
    
    // Set feature flags context
    featureFlags.setUserContext(profile.segment, profile.id);
    
    // Set analytics user ID
    analytics.setUserId(profile.id);
    
    // Track onboarding completion
    analytics.trackOnboardingComplete(profile);
  };

  const clearUserProfile = () => {
    setUserProfileState(null);
    setHasCompletedOnboarding(false);
    localStorage.removeItem('pf_user_profile');
    
    // Clear feature flags context
    featureFlags.setUserContext('', '');
    
    // Clear analytics user ID
    analytics.setUserId('');
  };

  const refreshProfile = async () => {
    if (userProfile) {
      await refreshProfileFromServer(userProfile.id);
    }
  };

  const value: UserContextType = {
    userProfile,
    isLoading,
    hasCompletedOnboarding,
    setUserProfile,
    clearUserProfile,
    refreshProfile
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
