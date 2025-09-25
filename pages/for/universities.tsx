import { useEffect } from "react";
import { useRouter } from "next/router";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";

export default function ForUniversities() {
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    // Redirect to main /for page with universities tab
    router.replace("/for?tab=universities");
  }, [router]);

  return (
    <>
      <SEOHead 
        pageKey="universities"
        title={t('for.universities.ogTitle')}
        description="Advance your research and academic projects with specialized funding programs."
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
