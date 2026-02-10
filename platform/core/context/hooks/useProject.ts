/**
 * useProject Hook
 * Direct Zustand store access for performance-critical components
 * Bypasses React Context layer for fine-grained subscriptions
 * 
 * Usage:
 * const userProfile = useProject((state) => state.userProfile);
 * const documentStructure = useProject((state) => state.documentStructure);
 * 
 * Better than useProjectContext for:
 * - Preventing unnecessary re-renders (selector pattern)
 * - Performance-critical sections
 * - Deep component hierarchies
 */

import { useProjectStore } from '../../store/useProjectStore';

/**
 * Hook for direct Zustand store access with selector pattern
 * This is the preferred way to access project state in performance-critical components
 * 
 * @example
 * const userProfile = useProject((state) => state.userProfile);
 * const setUserProfile = useProject((state) => state.setUserProfile);
 */
export const useProject = useProjectStore;
