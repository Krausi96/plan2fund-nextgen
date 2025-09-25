import Link from "next/link";
import { Button } from "@/components/ui/button";
import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";

const getPlans = (t: (key: any) => string) => [
  { 
    id: "strategy",
    title: t('planTypes.strategy.title'), 
    price: "From €99", 
    desc: t('planTypes.strategy.description'), 
    features: [
      t('planTypes.strategy.features.0'),
      t('planTypes.strategy.features.1'),
      t('planTypes.strategy.features.2')
    ],
    mode: "strategy",
    badges: [
      t('planTypes.strategy.badges.0'),
      t('planTypes.strategy.badges.1'),
      t('planTypes.strategy.badges.2')
    ],
    helper: t('planTypes.strategy.helper'),
    cta: t('pricing.cta.startStrategy')
  },
  { 
    id: "review",
    title: t('planTypes.review.title'), 
    price: "From €149", 
    desc: t('planTypes.review.description'), 
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
    cta: t('pricing.cta.startUpdateReview')
  },
  { 
    id: "custom",
    title: t('planTypes.custom.title'), 
    price: "From €299", 
    desc: t('planTypes.custom.description'), 
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
    cta: t('pricing.cta.startBusinessPlan')
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
              <p className="text-gray-600 mt-2" dangerouslySetInnerHTML={{ __html: plan.desc }}></p>
              <p className="text-lg font-semibold mt-4 text-blue-600">{plan.price}</p>
              <ul className="mt-6 space-y-2">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start space-x-2 text-gray-600">
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
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

        {/* Plan Details */}
        <section className="max-w-6xl mx-auto py-16 px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pricing.planDetails')}</h2>
          </div>
          
          <div className="space-y-16">
            
            {/* Strategy Document Details */}
            <div id="strategy" className="scroll-mt-20">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">🧩 Strategy Document (Business Model & GTM)</h3>
              
              <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">What it's for</h4>
                  <ul className="text-gray-700 space-y-1">
                      <li>• Early ideas or pivots that need clarity before a full plan</li>
                      <li>• Decide target customer, pricing and first channels</li>
                  </ul>
                </div>

                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">You provide</h4>
                  <ul className="text-gray-700 space-y-1">
                      <li>• Idea and goals</li>
                      <li>• Notes on market/competitors (optional)</li>
                      <li>• Rough numbers (optional)</li>
                  </ul>
                </div>

                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">What you get</h4>
                  <ul className="text-gray-700 space-y-1">
                      <li>• Business model & GTM summary (value prop, ICP, pricing/positioning, channels)</li>
                      <li>• Unit economics sketch + milestones / next steps</li>
                      <li>• DE/EN deliverable you can later extend to a full plan</li>
                  </ul>
                </div>
                </div>

                <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Outline</h4>
                    <div className="flex flex-wrap gap-2">
                      {t("pricing.sections.strategy").split(", ").map((item, index) => (
                        <span key={index} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                          {item}
                        </span>
                      ))}
                    </div>
                </div>

                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Export & language</h4>
                    <p className="text-gray-700">PDF/DOCX · DE/EN · 4–8 pages</p>
                </div>

                  <div className="border-t pt-4">
                    <Link href="/editor?plan=strategy" className="inline-block">
                      <Button>Start Strategy</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Update & Review Details */}
            <div id="review" className="scroll-mt-20">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">🔄 Update & Review</h3>
              
              <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">What it's for</h4>
                  <ul className="text-gray-700 space-y-1">
                      <li>• You have text/drafts and want a plan that passes checks</li>
                      <li>• Bring structure, fill gaps, add missing financials</li>
                  </ul>
                </div>

                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">You provide</h4>
                  <ul className="text-gray-700 space-y-1">
                      <li>• Your existing text (paste by section)</li>
                      <li>• Target route (aws/FFG/WA/bank/visa), if known</li>
                      <li>• Latest basic numbers</li>
                  </ul>
                </div>

                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">What you get</h4>
                  <ul className="text-gray-700 space-y-1">
                      <li>• Section-by-section gap notes + restructured content</li>
                      <li>• Financial tables added or cleaned (revenue, costs, cash-flow, use of funds)</li>
                      <li>• Submission alignment notes + formatting to expected style</li>
                  </ul>
                </div>
                </div>

                <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Outline</h4>
                    <div className="flex flex-wrap gap-2">
                      {t("pricing.sections.review").split(", ").map((item, index) => (
                        <span key={index} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                          {item}
                        </span>
                      ))}
                    </div>
                </div>

                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Export & language</h4>
                    <p className="text-gray-700">PDF/DOCX · DE/EN · length depends on your material</p>
                </div>

                  <div className="border-t pt-4">
                    <Link href="/editor?plan=review" className="inline-block">
                      <Button>Start Update & Review</Button>
                    </Link>
                    <p className="text-xs text-gray-500 mt-2">Paste, don't upload — edit everything in the builder.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission-Ready Business Plan Details */}
            <div id="custom" className="scroll-mt-20">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">📘 Submission-Ready Business Plan</h3>
              
              <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">What it's for</h4>
                  <ul className="text-gray-700 space-y-1">
                      <li>• Grants (aws/FFG/WA/EU), visas or bank loans when your model is defined</li>
                      <li>• A plan reviewers can scan in the expected order</li>
                  </ul>
                </div>

                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">You provide</h4>
                  <ul className="text-gray-700 space-y-1">
                      <li>• Model summary (offer, customer, pricing, channels)</li>
                      <li>• Basic numbers (price, volumes, costs, funding need)</li>
                      <li>• Target program/bank/visa (if known)</li>
                  </ul>
                </div>

                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">What you get</h4>
                  <ul className="text-gray-700 space-y-1">
                      <li>• Full plan with standard sections (Exec Summary → Financials)</li>
                      <li>• Tables: revenue model, cost breakdown, cash-flow, use of funds</li>
                      <li>• Submission checklist aligned to your selected route</li>
                  </ul>
                </div>
                </div>

                <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Outline</h4>
                    <div className="flex flex-wrap gap-2">
                      {t("pricing.sections.custom").split(", ").map((item, index) => (
                        <span key={index} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                          {item}
                        </span>
                      ))}
                    </div>
                </div>

                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Export & language</h4>
                    <p className="text-gray-700">PDF/DOCX · DE/EN · 15–35 pages</p>
                </div>

                  <div className="border-t pt-4">
                    <Link href="/editor?plan=custom" className="inline-block">
                      <Button>Start Business Plan</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Add-on Pack Section */}
        <section id="addons" className="max-w-4xl mx-auto py-16 px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pricing.addonPack')}</h2>
            <p className="text-gray-600">
              {t('pricing.addonPackDesc')}
            </p>
            <p className="text-sm text-gray-500 mt-4">
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
