// User Context for Profile Management and State
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserProfile, validateUserProfile } from '@/shared/user/schemas/userProfile';
import featureFlags from '@/shared/user/featureFlags';
import analytics from '@/shared/user/analytics';

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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const refreshProfileFromServer = useCallback(async () => {
    try {
      // Use new auth session endpoint instead of old profile endpoint
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          const profile = {
            id: String(data.user.id),
            segment: data.user.segment || 'B2C_FOUNDER',
            programType: data.user.program_type || 'GRANT',
            industry: data.user.industry || 'GENERAL',
            language: data.user.language || 'EN',
            payerType: data.user.payer_type || 'INDIVIDUAL',
            experience: data.user.experience || 'NEWBIE',
            createdAt: data.user.created_at,
            lastActiveAt: data.user.last_active_at,
            gdprConsent: data.user.gdpr_consent || true
          };
          setUserProfileState(profile);
          if (typeof window !== 'undefined') {
            localStorage.setItem('pf_user_profile', JSON.stringify(profile));
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing profile from server:', error);
    }
  }, []);

  const loadUserProfile = useCallback(async () => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

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
            await refreshProfileFromServer();
          }
        } catch (parseError) {
          console.error('Error parsing stored profile:', parseError);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('pf_user_profile');
          }
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshProfileFromServer]);

  useEffect(() => {
    if (isMounted) {
      loadUserProfile();
    }
  }, [isMounted, loadUserProfile]);

  const setUserProfile = (profile: UserProfile) => {
    setUserProfileState(profile);
    setHasCompletedOnboarding(true);
    
    // Store in localStorage (only on client)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pf_user_profile', JSON.stringify(profile));
    }
    
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
    
    // Clear from localStorage (only on client)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pf_user_profile');
    }
    
    // Clear feature flags context
    featureFlags.setUserContext('', '');
    
    // Clear analytics user ID
    analytics.setUserId('');
  };

  const refreshProfile = async () => {
    if (userProfile) {
      await refreshProfileFromServer();
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
