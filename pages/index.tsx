import { Hero } from "@/components/common/Hero"
import { HowItWorks } from "@/components/common/HowItWorks"
import { WhoItsFor } from "@/components/common/WhoItsFor"
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
        
        {/* Recommendation Engine CTA */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Find Your Perfect Funding Match
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Our AI-powered recommendation engine analyzes your business profile and finds the Austrian & EU funding programs you're most likely to qualify for.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/reco"
                className="inline-block px-8 py-4 bg-white text-blue-600 rounded-xl shadow-lg hover:bg-blue-50 transition-all duration-300 font-semibold text-lg hover:shadow-xl hover:scale-105"
              >
                Get Recommendations
              </a>
              <a
                href="/advanced-search"
                className="inline-block px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 font-semibold text-lg"
              >
                Advanced Search
              </a>
            </div>
          </div>
        </section>
        
        <WhoItsFor />
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
            href: "/features"
          }}
        />
      </main>
    </>
  )
}
