import { useEffect } from "react";
import { useRouter } from "next/router";
import SEOHead from "@/components/common/SEOHead";

export default function ForSME() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main /for page with sme tab
    router.replace("/for?tab=sme");
  }, [router]);

  return (
    <>
      <SEOHead 
        pageKey="sme"
        title="SMEs & Established Businesses - Plan2Fund"
        description="Scale your existing business with strategic funding and expansion plans."
      />
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    </>
  );
}
