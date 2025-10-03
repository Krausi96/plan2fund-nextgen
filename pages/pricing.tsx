import Link from "next/link";
import { Button } from "@/components/ui/button";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { PricingDetails } from "@/components/common/PricingDetails";
import { useI18n } from "@/contexts/I18nContext";
import { detectTargetGroup, TargetGroup } from "@/lib/targetGroupDetection";
import { useState, useEffect } from "react";
import { Tooltip } from "@/components/common/Tooltip";
import { CheckCircle, Clock, Users, FileText, Download, Star, ArrowRight } from "lucide-react";

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

  const isPlanRecommended = (planId: string) => {
    switch (targetGroup) {
      case 'startups':
        return planId === 'custom';
      case 'sme':
        return planId === 'review';
      case 'advisors':
        return planId === 'custom';
      case 'universities':
        return planId === 'custom';
      default:
        return false;
    }
  };

  return (
    <>
      <SEOHead pageKey="pricing" schema="faq" />
      
      <main className="bg-gray-50">
        {/* Hero Section */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t('pricing.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t('pricing.subtitle')}
            </p>
            
            {/* Target Group Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { id: 'default', label: 'All', icon: '👥' },
                { id: 'startups', label: 'Startups', icon: '🚀' },
                { id: 'sme', label: 'SMEs', icon: '🏢' },
                { id: 'advisors', label: 'Advisors', icon: '👨‍💼' },
                { id: 'universities', label: 'Innovation Hubs', icon: '🎓' }
              ].map((group) => (
                <button
                  key={group.id}
                  onClick={() => setTargetGroup(group.id as TargetGroup)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    targetGroup === group.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <span>{group.icon}</span>
                  <span>{group.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Plans Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Choose Your Plan
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {getPersonaMessage()}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div key={plan.id} className={`relative bg-white rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  isPlanRecommended(plan.id) ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                }`}>
                  {/* Recommended Badge */}
                  {isPlanRecommended(plan.id) && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-2 text-sm font-semibold rounded-bl-lg flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Recommended
                    </div>
                  )}

                  <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="text-5xl mb-4">{plan.icon}</div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.title}</h3>
                      <div className="text-4xl font-bold text-blue-600 mb-4">{plan.price}</div>
                      
                      {/* Target Audience */}
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Perfect for:
                        </h4>
                        <p className="text-sm text-blue-800">{plan.desc}</p>
                      </div>
                    </div>

                    {/* What You Provide */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        What you provide:
                      </h4>
                      <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                        {plan.id === 'strategy' && "Your idea, goals, and any market notes (optional)"}
                        {plan.id === 'review' && "Your existing draft text and latest numbers"}
                        {plan.id === 'custom' && "Model summary, basic numbers, and target route (if known)"}
                      </p>
                    </div>

                    {/* What You Get */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        What you get:
                      </h4>
                      <div className="space-y-2">
                        {plan.features.slice(0, 4).map((feature, idx) => (
                          <div key={idx} className="flex items-start text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                        {plan.features.length > 4 && (
                          <div className="text-sm text-gray-500 italic">
                            + {plan.features.length - 4} more features
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Documents Included */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Download className="w-4 h-4 text-purple-600" />
                        Documents included:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">PDF</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">DOCX</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">DE/EN</span>
                        {plan.id === 'custom' && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">15-35 pages</span>
                        )}
                        {plan.id === 'strategy' && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">4-8 pages</span>
                        )}
                      </div>
                    </div>

                    {/* Add-ons */}
                    {plan.addons && plan.addons.length > 0 && (
                      <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Optional Add-ons:
                        </h4>
                        <div className="space-y-1">
                          {plan.addons.map((addon, idx) => (
                            <div key={idx} className="text-sm text-orange-800">
                              {addon}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <Link href={`/editor?product=${plan.id}&route=${getDefaultRoute()}`} className="block">
                      <Button className="w-full py-3 text-base font-semibold bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                        {plan.cta}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
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
