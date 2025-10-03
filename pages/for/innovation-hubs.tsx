import { useRouter } from "next/router";
import SEOHead from "@/components/common/SEOHead";
import { Hero } from "@/components/common/Hero";
import { WhyPlan2Fund } from "@/components/common/WhyPlan2Fund";
import { WhoItsFor } from "@/components/common/WhoItsFor";
import { PlanTypes } from "@/components/common/PlanTypes";
import { HowItWorks } from "@/components/common/HowItWorks";
import { WhyAustria } from "@/components/common/WhyAustria";
import CTAStrip from "@/components/common/CTAStrip";
import { useI18n } from "@/contexts/I18nContext";

export default function ForInnovationHubs() {
  const { t } = useI18n();
  const router = useRouter();

  const handleStepClick = (stepId: number) => {
    switch (stepId) {
      case 1:
        router.push('/reco');
        break;
      case 2:
        router.push('/reco');
        break;
      case 3:
        router.push('/reco');
        break;
      case 4:
        router.push('/editor');
        break;
      case 5:
        router.push('/reco');
        break;
      default:
        router.push('/reco');
    }
  };

  return (
    <>
      <SEOHead 
        pageKey="universities"
        title="Innovation Hub & Research Tools | Plan2Fund"
        description="Support innovation teams and research projects with professional business planning. Help research teams find funding and create business plans."
        keywords="innovation hub tools, research teams, research funding, innovation platform, research business plans Austria"
        schema="organization"
      />
      
      <main className="flex flex-col">
        <Hero targetGroup="universities" onStepClick={handleStepClick} />
        <WhyPlan2Fund targetGroup="universities" />
        <WhoItsFor targetGroup="universities" />
        <PlanTypes targetGroup="universities" />
        <HowItWorks targetGroup="universities" />
        <WhyAustria targetGroup="universities" />
        <CTAStrip
          title={t('cta.readyToFind')}
          subtitle={t('cta.joinFounders')}
          primaryAction={{
            label: t('cta.startPlan'),
            href: "/editor"
          }}
          secondaryAction={{
            label: t('cta.learnMore'),
            href: "/about"
          }}
        />
      </main>
    </>
  );
}
