import { Hero } from '@/shared/components/common/Hero';
import CTAStrip from '@/shared/components/common/CTAStrip';
import SEOHead from '@/shared/components/common/SEOHead';
import { useI18n } from "@/shared/contexts/I18nContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import analytics from "@/shared/user/analytics";
import { CheckCircle } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";

export default function Home() {
  const { t } = useI18n();
  const router = useRouter();
  const [selectedTargetGroup, setSelectedTargetGroup] = useState<string | null>(null);

  // Initialize selectedTargetGroup from detection/localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
  }, []);

  // Handle target group selection from banner (propagated from Hero)
  const handleTargetGroupSelect = (targetGroup: string) => {
    setSelectedTargetGroup(targetGroup);
  };

  // Current target group used for highlighting sections
  const targetGroup = selectedTargetGroup || 'default';

  useEffect(() => {
    analytics.trackPageView('/', 'Home');
    analytics.trackUserAction('home_page_viewed');
  }, []);

  const handleStepClick = (stepId: number) => {
    // Map step IDs to different actions in the new app structure
    switch (stepId) {
      case 1: // Idea - Define Business Concept
      case 2: // Business Model - Prepare Market Entry
      case 3: // Funding - Find Funding Options
        router.push('/app/user/reco');
        break;
      case 4: // Business Plan - Build your Business Plan
      case 5: // Application - Apply for funding
        router.push('/app/user/editor?product=submission&route=grant');
        break;
      default:
        router.push('/app/user/reco');
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
        {/* Who Its For Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-white to-neutral-50" aria-labelledby="who-its-for-heading">
          <div className="container max-w-7xl">
            <div className="text-center mb-16">
              <h2 id="who-its-for-heading" className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 tracking-tight">
                {t("whoItsFor.title")}
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
                {t("whoItsFor.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[
                {
                  title: t("whoItsFor.soloEntrepreneurs.title"),
                  description: t("whoItsFor.soloEntrepreneurs.description"),
                  features: [
                    t("whoItsFor.soloEntrepreneurs.feature1"),
                    t("whoItsFor.soloEntrepreneurs.feature2"),
                    t("whoItsFor.soloEntrepreneurs.feature3")
                  ],
                  icon: "🚀",
                  iconBg: "bg-blue-100"
                },
                {
                  title: t("whoItsFor.sme.title"),
                  description: t("whoItsFor.sme.description"),
                  features: [
                    t("whoItsFor.sme.feature1"),
                    t("whoItsFor.sme.feature2"),
                    t("whoItsFor.sme.feature3")
                  ],
                  icon: "✏️",
                  iconBg: "bg-green-100"
                },
                {
                  title: t("whoItsFor.advisors.title"),
                  description: t("whoItsFor.advisors.description"),
                  features: [
                    t("whoItsFor.advisors.feature1"),
                    t("whoItsFor.advisors.feature2"),
                    t("whoItsFor.advisors.feature3")
                  ],
                  icon: "📋",
                  iconBg: "bg-purple-100"
                },
                {
                  title: t("whoItsFor.universities.title"),
                  description: t("whoItsFor.universities.description"),
                  features: [
                    t("whoItsFor.universities.feature1"),
                    t("whoItsFor.universities.feature2"),
                    t("whoItsFor.universities.feature3")
                  ],
                  icon: "🎓",
                  iconBg: "bg-indigo-100"
                }
              ].map((persona, index) => {
                const isHighlighted = targetGroup !== 'default' && (
                  (targetGroup === 'startups' && index === 0) ||
                  (targetGroup === 'sme' && index === 1) ||
                  (targetGroup === 'advisors' && index === 2) ||
                  (targetGroup === 'universities' && index === 3)
                );
                const isPrimary = targetGroup === 'default' && index === 0;
                return (
                  <div key={index} className="group relative">
                    <div className={`h-full flex flex-col p-8 rounded-2xl border transition-all duration-300 ${
                      isPrimary || isHighlighted
                        ? "border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg hover:shadow-xl" 
                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-xl"
                    } hover:-translate-y-2`}>
                      {(isPrimary || isHighlighted) && (
                        <div className="absolute top-6 right-6 drop-shadow-sm">
                          <Badge
                            variant={isPrimary ? "secondary" : "default"}
                            className="uppercase tracking-wide"
                          >
                            {isPrimary ? t("whoItsFor.badges.primary") : t("whoItsFor.badges.recommended")}
                          </Badge>
                        </div>
                      )}
                      <div className="mb-6 text-center">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform duration-300 ${persona.iconBg}`}>
                          <span className="text-3xl">{persona.icon}</span>
                        </div>
                        <h3 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                          {persona.title}
                        </h3>
                        <p className="text-base text-neutral-600 leading-relaxed">
                          {persona.description}
                        </p>
                      </div>
                      <div className="flex-grow mt-6">
                        <ul className="space-y-3">
                          {persona.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-start text-sm text-neutral-700">
                              <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                              <span className="leading-relaxed">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Plan Types Section */}
        <section className="py-20 md:py-28 bg-white">
          <div className="container max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 tracking-tight">
                {t("planTypes.title")}
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
                {t("planTypes.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  id: "strategy",
                  title: t("planTypes.strategy.title"),
                  icon: "💡",
                  subtitle: t("planTypes.strategy.subtitle"),
                  features: [
                    t("planTypes.strategy.feature1"),
                    t("planTypes.strategy.feature2"),
                    t("planTypes.strategy.feature3"),
                    t("planTypes.strategy.feature4")
                  ],
                  href: "/pricing#strategy"
                },
                {
                  id: "review",
                  title: t("planTypes.review.title"),
                  icon: "✏️",
                  subtitle: t("planTypes.review.subtitle"),
                  features: [
                    t("planTypes.review.feature1"),
                    t("planTypes.review.feature2"),
                    t("planTypes.review.feature3"),
                    t("planTypes.review.feature4")
                  ],
                  href: "/pricing#review"
                },
                {
                  id: "custom",
                  title: t("planTypes.custom.title"),
                  icon: "📋",
                  subtitle: t("planTypes.custom.subtitle"),
                  features: [
                    t("planTypes.custom.feature1"),
                    t("planTypes.custom.feature2"),
                    t("planTypes.custom.feature3"),
                    t("planTypes.custom.feature4")
                  ],
                  href: "/pricing#custom"
                }
              ].map((plan) => {
                const isHighlighted = targetGroup !== 'default' && (
                  (targetGroup === 'startups' && plan.id === 'strategy') ||
                  (targetGroup === 'sme' && plan.id === 'review') ||
                  (targetGroup === 'advisors' && plan.id === 'custom') ||
                  (targetGroup === 'universities' && plan.id === 'strategy')
                );
                return (
                  <a
                    key={plan.id}
                    href={plan.href}
                    className={`group block h-full rounded-2xl p-8 border-2 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/20 hover:shadow-2xl hover:-translate-y-2 ${
                      isHighlighted 
                        ? 'bg-gradient-to-br from-blue-50 via-white to-white border-blue-300 shadow-lg' 
                        : 'bg-white border-neutral-200 hover:border-blue-300 hover:shadow-xl'
                    }`}
                    aria-label={`Learn more about ${plan.title}`}
                >
                    <div className="mb-6">
                      <div className="mb-6 text-center">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md transition-all duration-300 ${
                          isHighlighted 
                            ? 'bg-gradient-to-br from-blue-100 to-blue-50 group-hover:scale-110' 
                            : 'bg-gradient-to-br from-neutral-100 to-neutral-50 group-hover:bg-blue-50 group-hover:scale-110'
                        }`}>
                          <span className="text-3xl">{plan.icon}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-neutral-900 group-hover:text-blue-600 transition-colors mb-3">
                          {plan.title}
                  </h3>
                      </div>
                      <p className="text-base text-neutral-600 leading-relaxed text-center">
                        {plan.subtitle}
                  </p>
                </div>
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-neutral-900 mb-4 uppercase tracking-wide">{t("planTypes.keyFeatures")}</h4>
                      <ul className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="text-sm text-neutral-700 flex items-start">
                            <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-8 pt-6 border-t border-neutral-200">
                      <p className="text-xs text-neutral-500 text-center">
                        <span className="font-semibold text-neutral-700">{t("planTypes.additionalDocs")}</span> {t("planTypes.additionalDocsNote")}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
        <CTAStrip
          title={t('cta.readyToFind')}
          subtitle={t('cta.joinFounders')}
          primaryAction={{
            label: t('nav.startPlan'),
            href: "/app/user/editor?product=submission&route=grant"
          }}
          secondaryAction={{
            label: t('cta.findYourFunding'),
            href: "/app/user/reco"
          }}
        />
      </main>
    </>
  )
}

