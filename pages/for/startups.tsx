import { useEffect } from "react";
import { useRouter } from "next/router";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";

export default function ForStartups() {
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    // Redirect to main /for page with startups tab
    router.replace("/for?tab=startups");
  }, [router]);

  return (
    <>
      <SEOHead 
        pageKey="startups"
        title={t('for.startups.ogTitle')}
        description="Turn your innovative ideas into reality with comprehensive business planning and early-stage funding."
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
