﻿import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import SiteBreadcrumbs from "@/components/layout/SiteBreadcrumbs";
import TargetGroupBanner from "@/components/common/TargetGroupBanner";
import { useRouter } from "next/router";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Define flow routes where Breadcrumbs should be shown (aligned to product workflow)
  const flowRoutes = [
    "/results",
    "/editor",
    "/preview",
    "/confirm",
    "/checkout",
    "/export",
    "/thank-you",
  ];

  const showBreadcrumbs = flowRoutes.some((route) =>
    router.pathname.startsWith(route)
  );

  // Check if this is the landing page
  const isLandingPage = router.pathname === "/";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      
      {/* Site-wide breadcrumbs for marketing pages */}
      {!isLandingPage && !showBreadcrumbs && <SiteBreadcrumbs />}
      
      {isLandingPage ? (
        // Landing page layout - no container constraints
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
      
      {/* Target Group Banner - Show only on landing page when no target group detected */}
      {isLandingPage && <TargetGroupBanner />}
    </div>
  );
}

