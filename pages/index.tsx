import { Hero } from "@/components/common/Hero"
import { HowItWorks } from "@/components/common/HowItWorks"
import { WhoItsFor } from "@/components/common/WhoItsFor"
import { PlanTypes } from "@/components/common/PlanTypes"
import { WhyPlan2Fund } from "@/components/common/WhyPlan2Fund"
import { WhyAustria } from "@/components/common/WhyAustria"
import CTAStrip from "@/components/common/CTAStrip"
import SEOHead from "@/components/common/SEOHead"
import { useI18n } from "@/contexts/I18nContext"
import { useEffect } from "react"
import analytics from "@/lib/analytics"
import { useRouter } from "next/router"

export default function Home() {
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    analytics.trackPageView('/', 'Home');
    analytics.trackUserAction('home_page_viewed');
  }, []);

  const handleStepClick = (stepId: number) => {
    // Map step IDs to different actions
    switch (stepId) {
      case 1: // Idea - Define Business Concept
        router.push('/editor');
        break;
      case 2: // Business Model - Prepare Market Entry
        router.push('/editor');
        break;
      case 3: // Funding - Find Funding Options
        router.push('/reco');
        break;
      case 4: // Business Plan - Build your Business Plan
        router.push('/editor');
        break;
      case 5: // Application - Apply for funding
        router.push('/reco');
        break;
      default:
        router.push('/reco');
    }
  };

  return (
    <>
      <SEOHead 
        pageKey="home" 
        schema="organization"
      />
      
      <main className="flex flex-col">
        <Hero onStepClick={handleStepClick} />
        <WhyPlan2Fund />
        <WhoItsFor />
        <PlanTypes />
        <HowItWorks />
        <WhyAustria />
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
  )
}
