import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";
import { Building, Shield, TrendingUp, Handshake } from "lucide-react";

export default function ForBanks() {
  const { t } = useI18n();
  
  const features = [
    {
      icon: Building,
      title: "Institutional Funding",
      description: "Access large-scale funding programs for institutional and corporate clients."
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Find funding programs with built-in risk management and compliance features."
    },
    {
      icon: TrendingUp,
      title: "Growth Capital",
      description: "Secure substantial funding for major expansion and development projects."
    },
    {
      icon: Handshake,
      title: "Partnership Programs",
      description: "Access collaborative funding opportunities and partnership programs."
    }
  ];

  return (
    <>
      <SEOHead pageKey="banks" />
      
      <main>
        <HeroLite
          title={t('forBanks.title')}
          subtitle={t('forBanks.subtitle')}
        />
        
        <section className="section-padding bg-white">
          <div className="container">
            <h1 className="sr-only">{t('forBanks.title')}</h1>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <CTAStrip
          title="Ready to explore institutional funding?"
          subtitle="Find the perfect funding programs for your financial institution."
          primaryAction={{
            label: t('cta.startPlan'),
            href: "/reco"
          }}
          secondaryAction={{
            label: t('cta.getInTouch'),
            href: "/contact"
          }}
        />
      </main>
    </>
  );
}
