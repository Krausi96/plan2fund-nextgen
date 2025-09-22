import { Hero } from "@/components/common/Hero"
import { HowItWorks } from "@/components/common/HowItWorks"
import { WhoItsFor } from "@/components/common/WhoItsFor"
import { WhyPlan2Fund } from "@/components/common/WhyPlan2Fund"
import { Testimonials } from "@/components/common/Testimonials"
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
        <HowItWorks />
        <WhoItsFor />
        <WhyPlan2Fund />
        <Testimonials />
        <CTAStrip
          title={t('cta.readyToFind')}
          subtitle={t('cta.joinFounders')}
          primaryAction={{
            label: t('cta.startPlan'),
            href: "/editor"
          }}
          secondaryAction={{
            label: t('cta.learnMore'),
            href: "/features"
          }}
        />
      </main>
    </>
  )
}
