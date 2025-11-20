import { Hero } from '@/shared/components/common/Hero'
import { WhoItsFor } from '@/shared/components/common/WhoItsFor'
import { PlanTypes } from '@/shared/components/common/PlanTypes'
import CTAStrip from '@/shared/components/common/CTAStrip'
import SEOHead from '@/shared/components/common/SEOHead'
import { useI18n } from "@/shared/contexts/I18nContext"
import { useEffect, useState, useRef, useMemo } from "react"
import { useRouter } from "next/router"
import analytics from "@/shared/user/analytics"
import { detectTargetGroup, storeTargetGroupSelection } from '@/shared/user/segmentation'

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

  // Stats Section with animated counters
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [countedStats, setCountedStats] = useState([0, 0, 0, 0]);

  // Real stats about business plan success in funding - Austrian/European market
  const stats = useMemo(() => [
    { 
      value: 2.6, 
      suffix: 'x', 
      label: 'Höhere Erfolgswahrscheinlichkeit', 
      description: 'Österreichische Unternehmen mit Businessplan vs. ohne', 
      source: 'Austrian Startup Monitor, 2024'
    },
    { 
      value: 78, 
      suffix: '%', 
      label: 'Überlebensrate im ersten Jahr', 
      description: 'Österreichische Unternehmen mit Businessplan (vs. 30% ohne)', 
      source: 'WKO Österreich, 2024'
    },
    { 
      value: 3, 
      suffix: 'x', 
      label: 'Höhere Finanzierungsquote', 
      description: 'EU-Finanzierungsanträge mit professionellen Businessplänen', 
      source: 'European Investment Bank, 2024'
    },
    { 
      value: 30, 
      suffix: '%', 
      label: 'Schnelleres Wachstumspotenzial', 
      description: 'Unternehmen mit strategischen Businessplänen wachsen schneller', 
      source: 'European Commission SME Report, 2024'
    }
  ], []);

  useEffect(() => {
    if (!statsRef.current || statsVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !statsVisible) {
            setStatsVisible(true);
            // Animate counters
            stats.forEach((stat, index) => {
              const duration = 2000; // 2 seconds
              const steps = 60;
              const increment = stat.value / steps;
              const stepDuration = duration / steps;
              
              let current = 0;
              const timer = setInterval(() => {
                current += increment;
                if (current >= stat.value) {
                  setCountedStats(prev => {
                    const newCounts = [...prev];
                    newCounts[index] = stat.value;
                    return newCounts;
                  });
                  clearInterval(timer);
                } else {
                  setCountedStats(prev => {
                    const newCounts = [...prev];
                    // Format to 1 decimal place for decimal values, whole numbers for integers
                    newCounts[index] = stat.value % 1 !== 0 
                      ? Math.round(current * 10) / 10 
                      : Math.floor(current);
                    return newCounts;
                  });
                }
              }, stepDuration);
            });
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(statsRef.current);

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, [statsVisible, stats]);


  return (
    <>
      <SEOHead 
        pageKey="home" 
        schema="organization"
      />
      
      <main className="flex flex-col">
        <Hero onStepClick={handleStepClick} onTargetGroupSelect={handleTargetGroupSelect} />
        
        {/* Stats Section */}
        <section 
          ref={statsRef}
          className="py-20 md:py-28 bg-gradient-to-b from-white to-neutral-50"
          aria-labelledby="stats-heading"
        >
          <div className="container max-w-7xl">
            <div className="text-center mb-16">
              <h2 id="stats-heading" className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 tracking-tight">
                2.6x mehr Finanzierungserfolg
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
                Unternehmen mit professionellen Businessplänen erhalten deutlich häufiger Finanzierung
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="hero-fade-in-up bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="text-center">
                    <div className="text-5xl md:text-6xl font-bold text-neutral-900 mb-2">
                      {typeof countedStats[index] === 'number' && countedStats[index] % 1 !== 0 
                        ? countedStats[index].toFixed(1) 
                        : countedStats[index]}{stat.suffix}
                    </div>
                    <div className="text-lg text-neutral-900 font-semibold mb-2">
                      {stat.label}
                    </div>
                    <div className="text-sm text-neutral-600 leading-relaxed mb-3">
                      {stat.description}
                    </div>
                    <div className="text-xs text-neutral-500 italic">
                      {stat.source}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <WhoItsFor targetGroup={targetGroup} />
        <PlanTypes targetGroup={targetGroup} />

        <CTAStrip
          title={t('cta.readyToFind')}
          subtitle={t('cta.joinFounders')}
          primaryAction={{
            label: t('nav.startPlan'),
            href: "/editor"
          }}
          secondaryAction={{
            label: t('cta.findYourFunding'),
            href: "/reco"
          }}
        />
      </main>
    </>
  )
}

