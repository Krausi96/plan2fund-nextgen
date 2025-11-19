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

  // Placeholder stats - to be replaced with real data
  const stats = useMemo(() => [
    { value: 100, suffix: '+', label: 'Funding Programs', icon: '💰' },
    { value: 50, suffix: '+', label: 'Business Plans Created', icon: '📋' },
    { value: 80, suffix: '%', label: 'Success Rate', icon: '✅' },
    { value: 24, suffix: 'h', label: 'Time Saved', icon: '⚡' }
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
                    newCounts[index] = Math.floor(current);
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

  // Trust Indicators - placeholder content
  const trustIndicators = [
    { title: 'GDPR Compliant', description: 'Your data is protected', icon: '🛡️' },
    { title: 'EU Data Centers', description: 'Stored in Austria', icon: '🇦🇹' },
    { title: 'Bank-Level Security', description: 'Encrypted & secure', icon: '🔒' },
    { title: 'You Own Your Data', description: 'Delete anytime', icon: '👤' }
  ];

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
          className="py-20 md:py-28 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden"
        >
          {/* Blueprint grid background */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 48px,
                  #60A5FA 48px,
                  #60A5FA 49px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 48px,
                  #60A5FA 48px,
                  #60A5FA 49px
                )
              `,
            }}
          />
          
          <div className="container max-w-7xl relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="hero-fade-in-up bg-white rounded-2xl p-8 border-2 border-blue-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="text-4xl mb-4">{stat.icon}</div>
                  <div className="text-5xl md:text-6xl font-bold text-blue-600 mb-2">
                    {countedStats[index]}{stat.suffix}
                  </div>
                  <div className="text-lg text-neutral-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <WhoItsFor targetGroup={targetGroup} />
        <PlanTypes targetGroup={targetGroup} />
        
        {/* Trust Indicators Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden">
          {/* Blueprint grid background */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 48px,
                  #60A5FA 48px,
                  #60A5FA 49px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 48px,
                  #60A5FA 48px,
                  #60A5FA 49px
                )
              `,
            }}
          />
          
          <div className="container max-w-7xl relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {trustIndicators.map((indicator, index) => (
                <div
                  key={index}
                  className="hero-fade-in-up bg-white rounded-2xl p-8 border-2 border-blue-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="text-4xl mb-4">{indicator.icon}</div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">
                    {indicator.title}
                  </h3>
                  <p className="text-base text-neutral-600">
                    {indicator.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

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

