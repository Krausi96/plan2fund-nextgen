import { useEffect } from "react";
import { useRouter } from "next/router";
import SEOHead from "@/components/common/SEOHead";

export default function ForBanks() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main /for page with banks tab
    router.replace("/for?tab=banks");
  }, [router]);

  return (
    <>
      <SEOHead 
        pageKey="banks"
        title="Banks & Financial Institutions - Plan2Fund"
        description="Access institutional funding programs and partnership opportunities for your financial institution."
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
