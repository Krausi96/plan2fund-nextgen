import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";
import { Rocket, Lightbulb, Target, Zap } from "lucide-react";

export default function ForStartups() {
  const { t } = useI18n();
  
  const features = [
    {
      icon: Rocket,
      title: "Pre-seed Funding",
      description: "Access early-stage funding programs to turn your innovative ideas into reality."
    },
    {
      icon: Lightbulb,
      title: "MVP Development",
      description: "Secure funding for building and testing your minimum viable product."
    },
    {
      icon: Target,
      title: "Market Validation",
      description: "Find programs that help you validate your market and business model."
    },
    {
      icon: Zap,
      title: "Rapid Growth",
      description: "Accelerate your startup's growth with targeted funding opportunities."
    }
  ];

  return (
    <>
      <SEOHead pageKey="startups" />
      
      <main>
        <HeroLite
          title={t('forStartups.title')}
          subtitle={t('forStartups.subtitle')}
        />
        
        <section className="section-padding bg-white">
          <div className="container">
            <h1 className="sr-only">{t('forStartups.title')}</h1>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <CTAStrip
          title={t('cta.readyToLaunch')}
          subtitle={t('cta.findPerfectFunding')}
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
