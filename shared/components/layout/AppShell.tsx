import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';
import Breadcrumbs from '@/shared/components/layout/Breadcrumbs';
import SiteBreadcrumbs from '@/shared/components/layout/SiteBreadcrumbs';
import { useRouter } from "next/router";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Define flow routes where Breadcrumbs should be shown (aligned to product workflow)
  const flowRoutes = [
    "/app/user/preview",
    "/confirm",
    "/checkout",
    "/app/user/export",
    "/checkout/success/thank-you",
  ];

  const showBreadcrumbs = flowRoutes.some((route) =>
    router.pathname.startsWith(route)
  );

  // Check if this is the landing page
  const isLandingPage = router.pathname === "/";
  
  // Hide breadcrumbs on /reco and /editor since they're starting points
  const hideBreadcrumbs = router.pathname === "/app/user/reco" || router.pathname === "/app/user/editor";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      
      {/* Site-wide breadcrumbs for marketing pages */}
      {!isLandingPage && !showBreadcrumbs && !hideBreadcrumbs && <SiteBreadcrumbs />}
      
      {isLandingPage || hideBreadcrumbs ? (
        // Landing page, reco page, and editor page layout - no container constraints
        <main id="main-content" className="flex-1">
          {children}
        </main>
      ) : (
        // Other pages layout - with container and breadcrumbs
        <main id="main-content" className="flex-1">
          <div className="container py-8">
            {showBreadcrumbs && <Breadcrumbs />}
            {children}
          </div>
        </main>
      )}
      
      <Footer />
    </div>
  );
}

