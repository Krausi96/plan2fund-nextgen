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

export default function ForSME() {
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
        pageKey="sme"
        title="SME Business Plans & Funding | Plan2Fund"
        description="Scale your business with the right funding. Get bank loans, equity investments, and EU grants with our professional business plan generator."
        keywords="SME business plan, bank loans, equity funding, EU grants, business growth Austria"
        schema="organization"
      />
      
      <main className="flex flex-col">
        <Hero targetGroup="sme" onStepClick={handleStepClick} />
        <WhyPlan2Fund targetGroup="sme" />
        <WhoItsFor targetGroup="sme" />
        <PlanTypes targetGroup="sme" />
        <HowItWorks targetGroup="sme" />
        <WhyAustria targetGroup="sme" />
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
