import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/common/Hero";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { PricingDetails } from "@/components/common/PricingDetails";
import { useI18n } from "@/contexts/I18nContext";
import { detectTargetGroup, TargetGroup } from "@/lib/targetGroupDetection";
import { useState, useEffect } from "react";
import { Tooltip } from "@/components/common/Tooltip";

const getPlans = () => [
  { 
    id: "strategy",
    title: "Idea Strategy", 
    icon: "💡", // Lightbulb for strategy/ideas
    price: "€99", 
    desc: "For solo founders or early-stage teams exploring a business idea. Helps decide who to serve, what to charge and how to enter the market.", 
    features: [
      "Business Model Canvas snapshot (9 building blocks)",
      "Go-to-market plan (target segment, pricing, promotion, channels)",
      "Unit economics (price, unit cost, contribution margin, break-even)",
      "Virtual Funding Expert for startup guidance",
      "Readiness Check for pre-seed & early-stage programs",
      "Roadmap with milestones and next steps",
      "Executive one-pager (DE/EN, PDF/DOCX)"
    ],
    whyNeeded: "Early ideas often lack structure. This packages lean startup methods into an actionable document that can later evolve into a full plan.",
    mode: "strategy",
    badges: ["DE/EN", "PDF/DOCX", "Edit anytime"],
    addons: ["Rush Delivery (+€49)", "One-on-One Consultation (+€99)"],
    cta: "Start Strategy",
    hasRouteExtras: false
  },
  { 
    id: "review",
    title: "Plan Review", 
    icon: "✏️", // Edit pencil for review/update
    price: "€149", 
    desc: "For entrepreneurs/SMEs with an existing draft that needs improvement. Appropriate for grant/bank/visa/equity applications.", 
    features: [
      "Structured reorganization and completion of your text",
      "Virtual Funding Expert for content improvement",
      "Readiness Check across multiple funding types",
      "Two rounds of revision and formatting (DE/EN)",
      "Addition of missing financials (revenue, costs, cash flow)",
      "Executive one-pager and PDF/DOCX export"
    ],
    whyNeeded: "Many founders draft plans themselves but miss critical sections or formatting. This ensures alignment with funder expectations and professional polish.",
    routeExtras: [
      "Work packages & timeline template",
      "Budget sheet with cost categories",
      "Annex guidance (CV template, market evidence)",
      "Bank summary page (ratios, repayment schedule)",
      "Investor teaser template and cap table"
    ],
    mode: "review",
    badges: ["DE/EN", "PDF/DOCX", "Edit anytime"],
    addons: ["Rush Delivery (+€49)", "Additional Revision (+€29)", "Custom Financial Modelling (+€79)"],
    cta: "Start Review",
    note: "Already wrote parts? Paste per section — no upload needed.",
    hasRouteExtras: true
  },
  { 
    id: "custom",
    title: "Submission Plan", 
    icon: "📘", // Book for full business plan
    price: "€199", 
    desc: "For applicants ready to submit to grants, banks, visas or equity investors. Suitable for startups, SMEs and advisors who need a complete, application-ready plan.", 
    features: [
      "Full business plan (15–25 pages) in standard order",
      "Financial tables: revenue model, cost breakdown, cash-flow forecast",
      "Virtual Funding Expert for specific requirements",
      "Detailed Readiness Check per funding route",
      "Document Pack for the chosen funding type",
      "Executive one-pager and PDF/DOCX export"
    ],
    whyNeeded: "This delivers a complete, professional plan ready for submission. It replaces the existing 'Custom' plan while reducing price from €299 to €199, making it more accessible.",
    routeExtras: [
      "Work packages & timeline template",
      "Budget sheet with cost categories",
      "Annex guidance (CV template, market evidence)",
      "Bank summary page (ratios, repayment schedule)",
      "Investor teaser template and cap table"
    ],
    mode: "custom",
    badges: ["DE/EN", "PDF/DOCX", "Edit anytime"],
    addons: ["Rush Delivery (+€49)", "Additional Revision (+€29)", "Custom Financial Modelling (+€79)", "One-on-One Consultation (+€99)"],
    cta: "Start Submission Plan",
    hasRouteExtras: true
  },
];

export default function Pricing() {
  const { t } = useI18n();
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('default');
  
  useEffect(() => {
    const detection = detectTargetGroup();
    setTargetGroup(detection.targetGroup);
  }, []);

  const plans = getPlans();
  
  // Persona-specific messaging
  const getPersonaMessage = () => {
    switch (targetGroup) {
      case 'startups':
        return "Perfect for startups seeking investor funding";
      case 'sme':
        return "Ideal for SMEs looking for growth financing";
      case 'advisors':
        return "Designed for advisors managing multiple clients";
      case 'universities':
        return "Built for innovation hubs and research teams";
      default:
        return "Choose the plan that fits your journey";
    }
  };

  // Persona-specific default route
  const getDefaultRoute = () => {
    switch (targetGroup) {
      case 'startups':
        return 'equity';
      case 'sme':
        return 'bank';
      case 'advisors':
        return 'equity';
      case 'universities':
        return 'grant';
      default:
        return 'grant';
    }
  };

  return (
    <>
      <SEOHead pageKey="pricing" schema="faq" />
      
      <main className="bg-white">
        <Hero
          targetGroup={targetGroup}
          onTargetGroupSelect={(tg) => setTargetGroup(tg as TargetGroup)}
        />

        {/* Plans Section */}
        <section id="plans" className="max-w-6xl mx-auto py-16 px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              {getPersonaMessage()}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <h1 className="sr-only">{t('pricing.title')}</h1>
          {plans.map((plan, i) => (
            <div key={i} className="rounded-2xl border-2 shadow-sm p-8 bg-white hover:shadow-xl hover:border-blue-300 hover:-translate-y-2 transition-all duration-300 group">
              {/* Header with icon and pricing */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mr-4 group-hover:bg-blue-100 transition-colors">
                    <span className="text-2xl">{plan.icon}</span>
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
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Document Pack (included when relevant):</h4>
                  <div className="flex flex-wrap gap-1">
                    {plan.routeExtras.map((extra, extraIndex) => (
                      <span key={extraIndex} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {extra}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {plan.addons && plan.addons.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Available add-ons:</h4>
                  <div className="space-y-1">
                    {plan.addons.map((addon, addonIndex) => (
                      <div key={addonIndex} className="text-xs text-gray-600 flex items-center">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                        {addon}
                      </div>
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
                {/* Persona-specific recommended badge */}
                {((targetGroup === 'startups' && plan.id === 'custom') ||
                  (targetGroup === 'sme' && plan.id === 'review') ||
                  (targetGroup === 'advisors' && plan.id === 'custom') ||
                  (targetGroup === 'universities' && plan.id === 'custom')) && (
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
                    Recommended
                  </span>
                )}
              </div>
              
              {/* Note for review plan */}
              {plan.note && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 font-medium">{plan.note}</p>
                </div>
              )}
              
              {/* Route Selection for Custom Plan */}
              {plan.mode === 'custom' && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Choose your route:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/editor?product=custom&route=grant`} className="block">
                      <Button variant={targetGroup === 'universities' ? "primary" : "outline"} className="w-full py-2 text-sm">
                        Grant
                      </Button>
                    </Link>
                    <Link href={`/editor?product=custom&route=bank`} className="block">
                      <Button variant={targetGroup === 'sme' ? "primary" : "outline"} className="w-full py-2 text-sm">
                        Bank
                      </Button>
                    </Link>
                    <Link href={`/editor?product=custom&route=equity`} className="block">
                      <Button variant={targetGroup === 'startups' ? "primary" : "outline"} className="w-full py-2 text-sm">
                        Equity
                      </Button>
                    </Link>
                    <Link href={`/editor?product=custom&route=visa`} className="block">
                      <Button variant="outline" className="w-full py-2 text-sm">
                        Visa
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-6 space-y-2">
                <Link href={`/editor?product=${plan.id}&route=${getDefaultRoute()}`} className="block">
                  <Button className="w-full py-3 text-base font-semibold group-hover:shadow-lg transition-all duration-300">
                    {plan.cta}
                  </Button>
                </Link>
                <Link href={`/checkout?product=${plan.id}&route=${getDefaultRoute()}`} className="block">
                  <Button variant="outline" className="w-full py-2 text-sm">
                    View Pricing Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          </div>
        </section>

        {/* Document Packs Section */}
        <section id="document-packs" className="max-w-6xl mx-auto py-16 px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Document Packs
            </h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              Each plan includes a Document Pack tailored to your funding route. These packs contain essential documents and templates that funders expect to see.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Grant Pack */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🏛️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Grant Pack</h3>
                <p className="text-sm text-gray-600">Government & EU funding</p>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span>Work packages & timeline template</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span>Budget sheet with cost categories</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span>Annex guidance (CV template, market evidence)</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 italic">
                Grant evaluators expect detailed project plans and budgets. This pack guides you through structuring work-packages and justifying costs.
              </p>
            </div>

            {/* Bank Pack */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🏦</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Bank Pack</h3>
                <p className="text-sm text-gray-600">Bank loans & credit</p>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span>Bank summary page (ratios, repayment schedule)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span>Financial ratios calculator (<Tooltip content="Debt Service Coverage Ratio - measures ability to pay debt">DSCR</Tooltip>, equity ratio)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span>Guarantee and collateral checklist</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 italic">
                Banks focus on repayment ability and collateral. This pack helps you compute financial ratios and prepare the bank summary page required by lenders.
              </p>
            </div>

            {/* Equity Pack */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">💼</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Equity Pack</h3>
                <p className="text-sm text-gray-600">Investors & venture capital</p>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  <span>Investor teaser template and pitch one-pager</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  <span>Capitalisation table (<Tooltip content="Company ownership before investment">pre</Tooltip>/<Tooltip content="Company ownership after investment">post</Tooltip>-money)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  <span>Exit strategy worksheet</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 italic">
                Equity investors want to understand ownership, valuation and exit plans. This pack guides founders in preparing an attractive investor teaser and cap table.
              </p>
            </div>

            {/* Visa Pack */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-orange-300 hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🛂</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Visa Pack</h3>
                <p className="text-sm text-gray-600">Immigration & residency</p>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  <span>Visa annex guidance and documentation checklist</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  <span>Legal requirements summary</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  <span>Residence permit application timeline</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 italic">
                Immigration authorities need proof of business viability and compliance. This pack provides a step-by-step checklist and explains legal documents required for residency visas.
              </p>
            </div>
          </div>
        </section>

        <PricingDetails />

        {/* Template Selection Section */}
        <section id="templates" className="max-w-6xl mx-auto py-16 px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Template
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Each template is optimized for specific funding routes and includes all required sections, 
              financial tables, and formatting guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Grant Template */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🏛️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Grant Template</h3>
                <p className="text-sm text-gray-600">Government & EU funding</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span>Work packages & timeline</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span>Budget sheet</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span>Annex guidance</span>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/editor?product=submission&route=grant">
                  <Button variant="outline" className="w-full">
                    Use Grant Template
                  </Button>
                </Link>
              </div>
            </div>

            {/* Bank Template */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🏦</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Bank Template</h3>
                <p className="text-sm text-gray-600">Loans & credit</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span>Bank summary page</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span>Financial ratios</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span>Repayment analysis</span>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/editor?product=submission&route=bank">
                  <Button variant="outline" className="w-full">
                    Use Bank Template
                  </Button>
                </Link>
              </div>
            </div>

            {/* Equity Template */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">💼</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Equity Template</h3>
                <p className="text-sm text-gray-600">Investors & VCs</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  <span>Investor teaser</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  <span>Cap table</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  <span>Exit strategy</span>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/editor?product=submission&route=equity">
                  <Button variant="outline" className="w-full">
                    Use Equity Template
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visa Template */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🛂</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Visa Template</h3>
                <p className="text-sm text-gray-600">Immigration & residency</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  <span>Visa annex guidance</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  <span>Legal requirements</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  <span>Documentation checklist</span>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/editor?product=submission&route=visa">
                  <Button variant="outline" className="w-full">
                    Use Visa Template
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

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

        {/* FAQ Section */}
        <section id="faq" className="max-w-4xl mx-auto py-16 px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              Common questions about our pricing and plans
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What's included in each plan?
              </h3>
              <p className="text-gray-600">
                Each plan includes the core business plan creation tools, Virtual Funding Expert guidance, 
                Readiness Check, and a Document Pack tailored to your chosen funding route. Higher-tier plans 
                include more comprehensive features and additional rounds of revision.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I upgrade my plan later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade from Idea Strategy to Plan Review, or from Plan Review to Submission Plan 
                at any time. We'll credit your previous payment towards the upgrade.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What if I need help with my plan?
              </h3>
              <p className="text-gray-600">
                All plans include access to our Virtual Funding Expert and Readiness Check. For additional 
                support, you can purchase add-ons like One-on-One Consultation or Additional Revision rounds.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How long does it take to complete a plan?
              </h3>
              <p className="text-gray-600">
                Most users complete their plans within 3-5 business days. Rush Delivery add-on is available 
                for 2-day turnaround. The actual time depends on how much information you provide initially.
              </p>
            </div>
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
