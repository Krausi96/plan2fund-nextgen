import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";

export default function Features() {
  const { t } = useI18n();

  return (
    <>
      <SEOHead pageKey="features" />
      
      <main>
        <HeroLite
          title={t('features.title')}
          subtitle={t('features.subtitle')}
        />
        
        <section className="section-padding">
          <div className="container">
            {/* Content placeholder */}
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
              <p className="text-neutral-600 mb-8">
                We're working on detailed feature documentation. In the meantime, 
                explore our platform to see these features in action.
              </p>
              <a
                href="/reco"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                Try it now
              </a>
            </div>
          </div>
        </section>
        
        <CTAStrip
          title={t('cta.readyToExplore')}
          subtitle={t('cta.seeHowPlatform')}
          primaryAction={{
            label: t('cta.startPlan'),
            href: "/reco"
          }}
          secondaryAction={{
            label: t('cta.viewPricing'),
            href: "/pricing"
          }}
        />
      </main>
    </>
  );
}
