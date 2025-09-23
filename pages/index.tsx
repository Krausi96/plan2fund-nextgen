import { Hero } from "@/components/common/Hero"
import { HowItWorks } from "@/components/common/HowItWorks"
import { WhoItsFor } from "@/components/common/WhoItsFor"
import { PlanTypes } from "@/components/common/PlanTypes"
import { WhyAustria } from "@/components/common/WhyAustria"
import { WhyPlan2Fund } from "@/components/common/WhyPlan2Fund"
import CTAStrip from "@/components/common/CTAStrip"
import SEOHead from "@/components/common/SEOHead"
import { useI18n } from "@/contexts/I18nContext"
import { useEffect } from "react"
import analytics from "@/lib/analytics"

export default function Home() {
  const { t } = useI18n();

  useEffect(() => {
    analytics.trackPageView('/', 'Home');
    analytics.trackUserAction('home_page_viewed');
  }, []);

  return (
    <>
      <SEOHead 
        pageKey="home" 
        schema="organization"
      />
      
      <main className="flex flex-col">
        <Hero />
        <WhoItsFor />
        <PlanTypes />
        <WhyAustria />
        <HowItWorks />
        <WhyPlan2Fund />
        <CTAStrip
          title={t('cta.readyToFind')}
          subtitle="Discover funding programs you qualify for and create a professional business plan in minutes."
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
