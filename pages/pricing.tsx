import Link from "next/link";
import { Button } from "@/components/ui/button";
import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { PricingDetails } from "@/components/common/PricingDetails";
import { useI18n } from "@/contexts/I18nContext";

const getPlans = () => [
  { 
    id: "strategy",
    title: "🧩 Strategy Document (Business Model & GTM) — 4–8 pages", 
    price: "From €99", 
    desc: "Turn your idea into a clear business model & go-to-market you can build on — upgradeable to a full plan.", 
    features: [
      "Business Model Canvas snapshot (9 blocks) with concise assumptions",
      "GTM essentials: target market, pricing, promotion, channels, sales tactics",
      "Unit economics (simple): price, unit cost, contribution margin, break-even",
      "Executive One-Pager (DE/EN); content carries over to the full plan"
    ],
    mode: "strategy",
    badges: ["DE/EN", "PDF/DOCX", "Edit anytime"],
    helper: "Recommended add-on: Add-on Pack for faster first draft and one extra revision.",
    cta: "Start Strategy",
    hasRouteExtras: false
  },
  { 
    id: "review",
    title: "🔄 Update & Review (improve your existing text)", 
    price: "From €149", 
    desc: "Paste your draft — we re-structure, complete missing parts, align to requirements, and polish.", 
    features: [
      "Re-structure & completion (we add missing sections and financials)",
      "Readiness Check — cross-checked to grant/bank/visa/equity requirements",
      "Customization & formatting: DE/EN, tone, pagination, references/quotations"
    ],
    routeExtras: [
      "Budget sheet",
      "Work packages & timeline", 
      "Annex guidance",
      "Bank summary",
      "Investor teaser & cap table"
    ],
    mode: "review",
    badges: ["DE/EN", "PDF/DOCX", "Edit anytime"],
    helper: "Recommended add-on: Add-on Pack for rush, one extra revision, and provider form help (one standard form).",
    cta: "Start Update & Review",
    note: "Already wrote parts? Paste per section — no upload needed.",
    hasRouteExtras: true
  },
  { 
    id: "custom",
    title: "📘 Submission-Ready Business Plan — 15–35 pages", 
    price: "From €299", 
    desc: "Application-ready plan for grants, banks, visas, or equity investors — in the order reviewers expect.", 
    features: [
      "Standard sections (Executive Summary → Financials)",
      "Financial tables: revenue, costs, cash-flow, use of funds",
      "Readiness Check — cross-checked to the chosen route's requirements"
    ],
    routeExtras: [
      "Budget sheet",
      "Work packages & timeline",
      "Annex guidance", 
      "Bank summary",
      "Investor teaser & cap table"
    ],
    mode: "custom",
    badges: ["DE/EN", "PDF/DOCX", "Edit anytime"],
    helper: "Recommended add-on: Add-on Pack for rush, one extra revision, and provider form help (one standard form).",
    cta: "Start Business Plan",
    hasRouteExtras: true
  },
];

export default function Pricing() {
  const { t } = useI18n();
  const plans = getPlans();

  return (
    <>
      <SEOHead pageKey="pricing" schema="faq" />
      
      <main className="bg-white">
        <HeroLite
          title={t('pricing.title')}
          subtitle={t('pricing.subtitle')}
        />

        <section id="plans" className="max-w-6xl mx-auto py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-4">
          <h1 className="sr-only">{t('pricing.title')}</h1>
          {plans.map((plan, i) => (
            <div key={i} className="rounded-2xl border-2 shadow-sm p-8 bg-white hover:shadow-xl hover:border-blue-300 hover:-translate-y-2 transition-all duration-300 group">
              {/* Header with icon and pricing */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mr-4 group-hover:bg-blue-100 transition-colors">
                    <span className="text-2xl">{plan.title.includes('Strategy') ? '🧩' : plan.title.includes('Review') ? '🔄' : '📘'}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{plan.title.split(' — ')[0]}</h2>
                    <p className="text-sm text-gray-500 font-medium">{plan.title.split(' — ')[1]}</p>
                  </div>
                </div>
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-blue-600">{plan.price}</p>
                  <p className="text-gray-600 mt-2">{plan.desc}</p>
                </div>
              </div>
              
              {/* Key features */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Includes:</h4>
                <ul className="space-y-2">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Route extras - only for review and custom */}
              {plan.hasRouteExtras && plan.routeExtras && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Route extras (included when relevant):</h4>
                  <div className="flex flex-wrap gap-1">
                    {plan.routeExtras.map((extra, extraIndex) => (
                      <span key={extraIndex} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {extra}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {plan.badges.map((badge, badgeIndex) => (
                  <span key={badgeIndex} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">
                    {badge}
                  </span>
                ))}
              </div>
              
              {/* Note for review plan */}
              {plan.note && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 font-medium">{plan.note}</p>
                </div>
              )}
              
              {/* Action Button */}
              <div className="mt-6">
                <Link href={`/editor?plan=${plan.mode}`} className="block">
                  <Button className="w-full py-3 text-base font-semibold group-hover:shadow-lg transition-all duration-300">
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
              Add-on Pack (optional)
            </h2>
            <p className="text-lg font-semibold text-blue-600 mb-2">
              +€39
            </p>
            <p className="text-gray-600 mb-4">
              Rush to first draft (target 3 business days) + one extra revision + provider form help (one standard form using your plan content).
            </p>
            <p className="text-sm text-gray-500">
              Not included: legal/visa advice, additional revisions, custom modelling, portal setup. Decisions are made by providers.
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
