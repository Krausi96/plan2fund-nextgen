/**
 * useUser Hook
 * Backward compatibility hook for existing code that uses useUser()
 * Maps to the unified ProjectStore's user-related state
 * 
 * DEPRECATED: New code should use useProject() directly
 * COMPATIBILITY: This hook ensures existing UserContext consumers continue to work
 * 
 * Usage:
 * const { userProfile, setUserProfile } = useUser();
 */

import type { UserProfile } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';

/**
 * User context value shape for backward compatibility
 */
export interface UserContextValue {
  userProfile: UserProfile | null;
  isLoadingUser: boolean;
  setUserProfile: (profile: UserProfile | null) => void;
  setIsLoadingUser: (loading: boolean) => void;
}

/**
 * Backward-compatible useUser hook
 * Extracts user-related state from unified ProjectStore
 * 
 * @deprecated Use useProject() instead for new code
 * @example
 * const { userProfile, setUserProfile } = useUser();
 */
export const useUser = (): UserContextValue => {
  const userProfile = useProjectStore((state) => state.userProfile);
  const isLoadingUser = useProjectStore((state) => state.isLoadingUser);
  const setUserProfile = useProjectStore((state) => state.setUserProfile);
  const setIsLoadingUser = useProjectStore((state) => state.setIsLoadingUser);

  return {
    userProfile,
    isLoadingUser,
    setUserProfile,
    setIsLoadingUser,
  };
};
