import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { UserProfile } from "@/shared/user/schemas/userProfile";
import { validateUserProfile } from "@/shared/user/schemas/userProfile";

interface UserContextValue {
  userProfile: UserProfile | null;
  isLoading: boolean;
  /**
   * Set or update the current user profile.
   * Passing null will clear the profile and storage.
   */
  setUserProfile: (profile: UserProfile | null) => void;
  /**
   * Clear the current user profile and any persisted state.
   */
  clearUserProfile: () => void;
  /**
   * Re-fetch the user profile from the backend if a session exists.
   */
  refreshUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

const STORAGE_KEY = "pf_user_profile";

function loadProfileFromStorage(): UserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const validated = validateUserProfile(parsed);
    return validated;
  } catch (error) {
    console.warn("[UserContext] Failed to load profile from storage", error);
    return null;
  }
}

async function fetchProfileFromApi(): Promise<UserProfile | null> {
  try {
    const res = await fetch("/api/user/profile", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      // 401/404 etc. just mean "no authenticated user"
      return null;
    }

    const data = await res.json();
    const validated = validateUserProfile(data?.profile ?? data);
    return validated;
  } catch (error) {
    console.warn("[UserContext] Failed to fetch user profile from API", error);
    return null;
  }
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <UserContextInnerProvider>{children}</UserContextInnerProvider>
);

const UserContextInnerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const persistProfile = useCallback((profile: UserProfile | null) => {
    if (typeof window === "undefined") return;

    try {
      if (profile) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.warn("[UserContext] Failed to persist profile", error);
    }
  }, []);

  const setUserProfile = useCallback(
    (profile: UserProfile | null) => {
      setUserProfileState(profile);
      persistProfile(profile);
    },
    [persistProfile]
  );

  const clearUserProfile = useCallback(() => {
    setUserProfile(null);
  }, [setUserProfile]);

  const refreshUserProfile = useCallback(async () => {
    setIsLoading(true);
    const profile = await fetchProfileFromApi();
    setUserProfile(profile);
    setIsLoading(false);
  }, [setUserProfile]);

  useEffect(() => {
    let isActive = true;

    const initialise = async () => {
      setIsLoading(true);

      // 1) Try to hydrate from localStorage (fast path)
      const stored = loadProfileFromStorage();
      if (stored && isActive) {
        setUserProfileState(stored);
        setIsLoading(false);
        // Optionally, we could still refresh in background; keep it simple for now.
        return;
      }

      // 2) Fallback to backend session-based profile, if any
      const profile = await fetchProfileFromApi();
      if (!isActive) return;

      setUserProfileState(profile);
      persistProfile(profile);
      setIsLoading(false);
    };

    void initialise();

    return () => {
      isActive = false;
    };
  }, [persistProfile]);

  const value = useMemo<UserContextValue>(
    () => ({
      userProfile,
      isLoading,
      setUserProfile,
      clearUserProfile,
      refreshUserProfile,
    }),
    [userProfile, isLoading, setUserProfile, clearUserProfile, refreshUserProfile]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}

