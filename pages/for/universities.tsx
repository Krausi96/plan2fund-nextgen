import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";
import { GraduationCap, Microscope, BookOpen, Users } from "lucide-react";

export default function ForUniversities() {
  const { t } = useI18n();
  
  const features = [
    {
      icon: GraduationCap,
      title: "Research Grants",
      description: "Access academic funding programs for research and development projects."
    },
    {
      icon: Microscope,
      title: "Innovation Projects",
      description: "Secure funding for cutting-edge research and innovation initiatives."
    },
    {
      icon: BookOpen,
      title: "Academic Funding",
      description: "Find funding opportunities for educational and academic programs."
    },
    {
      icon: Users,
      title: "Student Support",
      description: "Access funding programs that support student entrepreneurship and research."
    }
  ];

  return (
    <>
      <SEOHead pageKey="universities" />
      
      <main>
        <HeroLite
          title={t('forUniversities.title')}
          subtitle={t('forUniversities.subtitle')}
        />
        
        <section className="section-padding bg-white">
          <div className="container">
            <h1 className="sr-only">{t('forUniversities.title')}</h1>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <CTAStrip
          title="Ready to advance your research?"
          subtitle="Find the perfect funding programs for your academic and research projects."
          primaryAction={{
            label: t('cta.startPlan'),
            href: "/reco"
          }}
          secondaryAction={{
            label: t('cta.viewFeatures'),
            href: "/resources"
          }}
        />
      </main>
    </>
  );
}
