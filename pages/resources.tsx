import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";

export default function Resources() {
  const { t } = useI18n();

  return (
    <>
      <SEOHead pageKey="resources" schema="article" />
      
      <main>
        <HeroLite
          title={t('resources.title')}
          subtitle={t('resources.subtitle')}
        />
        
        <section className="section-padding">
          <div className="container">
            <h1 className="sr-only">{t('resources.title')}</h1>
            {/* Content placeholder */}
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold mb-4">Resource Library Coming Soon</h2>
              <p className="text-neutral-600 mb-8">
                We're building a comprehensive resource library with guides, templates, 
                and expert insights. Stay tuned!
              </p>
              <a
                href="/reco"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                Start your plan
              </a>
            </div>
          </div>
        </section>
        
        <CTAStrip
          title={t('cta.readyToAccess')}
          subtitle={t('cta.getExpertInsights')}
          primaryAction={{
            label: t('cta.startPlan'),
            href: "/reco"
          }}
          secondaryAction={{
            label: t('cta.viewFeatures'),
            href: "/features"
          }}
        />
      </main>
    </>
  );
}
