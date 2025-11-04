import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/shared/contexts/UserContext';

/**
 * Higher Order Component to protect routes that require authentication
 * Redirects unauthenticated users to login page with redirect parameter
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { userProfile, isLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !userProfile) {
        // Save intended destination for redirect after login
        const currentPath = router.asPath;
        router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
      }
    }, [userProfile, isLoading, router]);

    // Show loading state while checking authentication
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    // Don't render anything if not authenticated (will redirect)
    if (!userProfile) {
      return null;
    }

    // Render protected component
    return <Component {...props} />;
  };
}

