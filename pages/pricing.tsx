import Link from "next/link";
import { Button } from "@/components/ui/button";
import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { PricingDetails } from "@/components/common/PricingDetails";
import { useI18n } from "@/contexts/I18nContext";

const getPlans = (t: (key: any) => string) => [
  { 
    id: "strategy",
    title: t('planTypes.strategy.title'), 
    price: t('pricing.strategy.price'), 
    desc: t('planTypes.strategy.subtitle'), 
    features: [
      t('planTypes.strategy.features.0'),
      t('planTypes.strategy.features.1'),
      t('planTypes.strategy.features.2'),
      t('planTypes.strategy.features.3')
    ],
    mode: "strategy",
    badges: [
      t('planTypes.strategy.badges.0'),
      t('planTypes.strategy.badges.1'),
      t('planTypes.strategy.badges.2')
    ],
    helper: t('planTypes.strategy.helper'),
    cta: t('pricing.strategy.cta')
  },
  { 
    id: "review",
    title: t('planTypes.review.title'), 
    price: t('pricing.review.price'), 
    desc: t('planTypes.review.subtitle'), 
    features: [
      t('planTypes.review.features.0'),
      t('planTypes.review.features.1'),
      t('planTypes.review.features.2')
    ],
    mode: "review",
    badges: [
      t('planTypes.review.badges.0'),
      t('planTypes.review.badges.1'),
      t('planTypes.review.badges.2')
    ],
    helper: t('planTypes.review.helper'),
    cta: t('pricing.review.cta'),
    note: t('pricing.review.note')
  },
  { 
    id: "custom",
    title: t('planTypes.custom.title'), 
    price: t('pricing.custom.price'), 
    desc: t('planTypes.custom.subtitle'), 
    features: [
      t('planTypes.custom.features.0'),
      t('planTypes.custom.features.1'),
      t('planTypes.custom.features.2')
    ],
    mode: "custom",
    badges: [
      t('planTypes.custom.badges.0'),
      t('planTypes.custom.badges.1'),
      t('planTypes.custom.badges.2')
    ],
    helper: t('planTypes.custom.helper'),
    cta: t('pricing.custom.cta')
  },
];

export default function Pricing() {
  const { t } = useI18n();
  const plans = getPlans(t);

  return (
    <>
      <SEOHead pageKey="pricing" schema="faq" />
      
      <main className="bg-white">
        <HeroLite
          title={t('pricing.title')}
          subtitle={t('pricing.subtitle')}
        />

        <section id="plans" className="max-w-6xl mx-auto py-12 grid md:grid-cols-3 gap-8 px-4">
          <h1 className="sr-only">{t('pricing.title')}</h1>
          {plans.map((plan, i) => (
            <div key={i} className="rounded-2xl border shadow-sm p-6 bg-white hover:shadow-md transition">
              <h2 className="text-xl font-bold">{plan.title}</h2>
              <p className="text-lg font-semibold mt-2 text-blue-600">{plan.price}</p>
              <p className="text-gray-600 mt-2">{plan.desc}</p>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Includes:</h4>
                <ul className="space-y-2">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start space-x-2 text-gray-600">
                      <span className="text-blue-500 mr-2 mt-0.5">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                {plan.badges.map((badge, badgeIndex) => (
                  <span key={badgeIndex} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {badge}
                  </span>
                ))}
              </div>
              
              {/* Helper text */}
              <p className="text-xs text-gray-500 mt-3">{plan.helper}</p>
              
              {/* Note for review plan */}
              {plan.note && (
                <p className="text-xs text-gray-400 mt-2 italic">{plan.note}</p>
              )}
              
              {/* Action Button */}
              <div className="mt-6">
                <Link href={`/editor?plan=${plan.mode}`} className="block">
                  <Button className="w-full">
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </section>

        <PricingDetails />

        {/* Add-on Pack Section */}
        <section id="addons" className="max-w-4xl mx-auto py-16 px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('pricing.addonPack')}
            </h2>
            <p className="text-lg font-semibold text-blue-600 mb-2">
              {t('pricing.addonPackPrice')}
            </p>
            <p className="text-gray-600 mb-4">
              {t('pricing.addonPackDesc')}
            </p>
            <p className="text-sm text-gray-500">
              {t('pricing.addonPackNote')}
            </p>
          </div>
        </section>

        {/* Partners Section */}
        <section id="partners" className="max-w-4xl mx-auto py-16 px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Partners</h2>
            <p className="text-gray-600 mb-6">
              Banks, advisors, and universities can share the guided planner with clients to reduce back-and-forth and streamline the application process.
            </p>
            <a 
              href="/about#partners"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
            >
              Contact us
            </a>
          </div>
        </section>

        <CTAStrip
          title={t('cta.readyToStart')}
          subtitle={t('cta.choosePlan')}
          primaryAction={{
            label: t('cta.startPlan'),
            href: "/reco"
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
