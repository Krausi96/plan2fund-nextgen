import { Hero } from "@/components/common/Hero"
import { HowItWorks } from "@/components/common/HowItWorks"
import { WhoItsFor } from "@/components/common/WhoItsFor"
import { PlanTypes } from "@/components/common/PlanTypes"
import { WhyPlan2Fund } from "@/components/common/WhyPlan2Fund"
import { WhyAustria } from "@/components/common/WhyAustria"
import CTAStrip from "@/components/common/CTAStrip"
import SEOHead from "@/components/common/SEOHead"
import { useI18n } from "@/contexts/I18nContext"
import { useEffect, useState } from "react"
import analytics from "@/lib/analytics"
import { useRouter } from "next/router"
import { detectTargetGroup, storeTargetGroupSelection } from '@/lib/targetGroupDetection'

export default function Home() {
  const { t } = useI18n();
  const router = useRouter();
  const [selectedTargetGroup, setSelectedTargetGroup] = useState<string | null>(null);

  // Initialize selectedTargetGroup from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedTargetGroup');
      if (stored) {
        setSelectedTargetGroup(stored);
      }
    }
  }, []);

  // Get target group using enhanced detection (URL, UTM, referrer, etc.)
  // If user selected from banner, use that; otherwise use detection
  const targetGroup = selectedTargetGroup || (typeof window !== 'undefined' ? detectTargetGroup().targetGroup : 'default');

  // Handle target group selection from banner
  const handleTargetGroupSelect = (targetGroup: string) => {
    setSelectedTargetGroup(targetGroup);
    storeTargetGroupSelection(targetGroup as any);
  };

  useEffect(() => {
    analytics.trackPageView('/', 'Home');
    analytics.trackUserAction('home_page_viewed');
  }, []);

  const handleStepClick = (stepId: number) => {
    // Map step IDs to different actions
    switch (stepId) {
      case 1: // Idea - Define Business Concept
        router.push('/reco?product=strategy');
        break;
      case 2: // Business Model - Prepare Market Entry
        router.push('/reco?product=strategy');
        break;
      case 3: // Funding - Find Funding Options
        router.push('/reco');
        break;
      case 4: // Business Plan - Build your Business Plan
        router.push('/reco?product=submission');
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
        <Hero onStepClick={handleStepClick} onTargetGroupSelect={handleTargetGroupSelect} />
        <WhoItsFor targetGroup={targetGroup} />
        <PlanTypes targetGroup={targetGroup} />
        <WhyPlan2Fund targetGroup={targetGroup} />
        <HowItWorks targetGroup={targetGroup} />
        <WhyAustria targetGroup={targetGroup} />
        <CTAStrip
          title={t('cta.readyToFind')}
          subtitle={t('cta.joinFounders')}
          primaryAction={{
            label: t('cta.startPlan'),
            href: "/reco?product=submission"
          }}
          secondaryAction={{
            label: t('cta.learnMore'),
            href: "/reco"
          }}
        />
      </main>
    </>
  )
}
