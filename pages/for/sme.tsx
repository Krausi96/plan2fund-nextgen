import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";
import { Building2, TrendingUp, Users, Target } from "lucide-react";

export default function ForSME() {
  const { t } = useI18n();
  
  const features = [
    {
      icon: Building2,
      title: "Scale Your Business",
      description: "Access growth funding and expansion opportunities tailored for established SMEs."
    },
    {
      icon: TrendingUp,
      title: "Market Expansion",
      description: "Find funding programs to enter new markets and expand your operations."
    },
    {
      icon: Users,
      title: "Team Growth",
      description: "Secure funding for hiring, training, and developing your workforce."
    },
    {
      icon: Target,
      title: "Technology Upgrades",
      description: "Modernize your operations with technology-focused funding programs."
    }
  ];

  return (
    <>
      <SEOHead pageKey="sme" />
      
      <main>
        <HeroLite
          title={t('forSME.title')}
          subtitle={t('forSME.subtitle')}
        />
        
        <section className="section-padding bg-white">
          <div className="container">
            <h1 className="sr-only">{t('forSME.title')}</h1>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <CTAStrip
          title="Ready to scale your business?"
          subtitle="Find the perfect funding programs for your SME growth plans."
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
