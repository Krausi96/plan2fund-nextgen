import Link from "next/link";
import { Button } from "@/components/ui/button";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";
import { detectTargetGroup, TargetGroup } from "@/lib/targetGroupDetection";
import { useState, useEffect } from "react";
import { 
  Clock, 
  FileText, 
  ArrowRight, 
  Building2, 
  Banknote, 
  Briefcase, 
  Plane, 
  Zap, 
  Calculator, 
  MessageCircle, 
  Presentation,
  Globe,
  Shield,
  Award,
  FileCheck,
  CheckCircle,
  Download,
  Plus
} from "lucide-react";

// Core Products Data
const coreProducts = [
  {
    id: "strategy",
    title: "Strategy Plan",
    price: "€99",
    bestFor: "Idea-stage founders exploring funding options",
    includes: "2–3 lightweight docs to clarify your idea & funding direction",
    icon: "💡",
    color: "blue"
  },
  {
    id: "review", 
    title: "Review Plan",
    price: "€149",
    bestFor: "Founders with a draft plan needing polish",
    includes: "Annotated feedback, improved plan, compliance checks",
    icon: "✏️",
    color: "green"
  },
  {
    id: "submission",
    title: "Submission Plan", 
    price: "€199",
    bestFor: "Ready-to-apply founders",
    includes: "Full, funder-ready documentation bundles",
    icon: "📘",
    color: "purple"
  }
];

// Document Counts by Product & Funding Type
const documentCounts = {
  strategy: {
    grants: "3 docs → Lean strategy brief (5–7 pp), Business Model Canvas, Funding match summary",
    bankLoans: "2 docs → Loan-oriented brief, Funding match summary",
    equity: "3 docs → Investor positioning brief, One-pager teaser, Funding match summary", 
    visa: "2 docs → Visa viability brief, Funding match summary"
  },
  review: {
    grants: "3–4 docs → Annotated draft, Revised plan, Compliance checklist, (opt.) budget check",
    bankLoans: "3–4 docs → Annotated draft, Revised bank plan, Ratios/DSCR check, (opt.) amortization review",
    equity: "3–4 docs → Annotated plan/deck, Revised investor plan, Cap table check, (opt.) model review",
    visa: "2–3 docs → Annotated visa plan, Revised visa plan, (opt.) CV tidy-up"
  },
  submission: {
    grants: "5–6 docs → Full grant plan (20–30 pp), Work plan & Gantt, Budget sheet, Team CVs, Annex guidance, (opt.) pitch deck outline",
    bankLoans: "5 docs → Loan-ready business plan, 3–5y financial model, Bank summary one-pager, Amortization schedule, Collateral sheet",
    equity: "5 docs → Investor plan, One-pager teaser, Pitch deck content pack, 5y financial model, Cap table",
    visa: "3–4 docs → Visa-specific business plan, Founder CV, Visa evidence checklist, (opt.) talking points/short pitch"
  }
};

// Funding Type Packages
const fundingTypes = [
  {
    id: "grants",
    title: "Grants",
    description: "Austrian & EU grant applications",
    icon: Building2,
    color: "green",
    language: "German default, English toggle",
    requirements: "Business Plan, Work Plan & Gantt, Budget Sheet, CVs, Annexes",
    expertise: "AWS, FFG, Horizon Europe, Regional Grants"
  },
  {
    id: "bankLoans", 
    title: "Bank Loans",
    description: "Austrian bank financing",
    icon: Banknote,
    color: "blue", 
    language: "German default",
    requirements: "Business Plan, Financials, Repayment Schedule, Collateral",
    expertise: "Austrian Banking Standards, WKO Guidelines"
  },
  {
    id: "equity",
    title: "Equity Investment", 
    description: "Venture capital & angel investors",
    icon: Briefcase,
    color: "purple",
    language: "English default, German optional",
    requirements: "Pitch Deck, One-pager Teaser, Cap Table, 5y Model",
    expertise: "Austrian/EU VC Landscape, Investment Standards"
  },
  {
    id: "visa",
    title: "Visa (RWR)",
    description: "Red-White-Red visa applications", 
    icon: Plane,
    color: "orange",
    language: "English default, German toggle",
    requirements: "Business Plan, CVs, Proof of €30k+ funds, Evidence checklist",
    expertise: "Austrian Immigration Law, AMS Requirements"
  }
];

// Add-ons
const addons = [
  { name: "Extra revision cycle", price: "+€29", icon: Clock },
  { name: "Custom financial modeling", price: "+€79", icon: Calculator },
  { name: "1:1 consultation (45 min)", price: "+€99", icon: MessageCircle },
  { name: "Pitch deck export (designed slides)", price: "+€59", icon: Presentation },
  { name: "Rush Delivery (48h)", price: "+€49", icon: Zap }
];

export default function Pricing() {
  const { t } = useI18n();
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('default');
  
  useEffect(() => {
    const detection = detectTargetGroup();
    setTargetGroup(detection.targetGroup);
  }, []);

  // Target group specific funding type recommendations
  const getRecommendedFundingTypes = () => {
    switch (targetGroup) {
      case 'startups':
        return ['grants', 'equity'];
      case 'sme':
        return ['bankLoans', 'grants'];
      case 'advisors':
        return ['all'];
      case 'universities':
        return ['grants', 'equity'];
      default:
        return ['all'];
    }
  };

  const recommendedTypes = getRecommendedFundingTypes();

  return (
    <>
      <SEOHead pageKey="pricing" schema="faq" />
      
      <main className="bg-gray-50">
        {/* Hero Section */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your Plan & Funding Type
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto">
              Professional business plans tailored to Austrian/EU funding requirements. 
              Built specifically for the Austrian and EU funding landscape.
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

        {/* Core Products Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Core Products
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Choose the plan that matches your stage
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {coreProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-8">
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-4">{product.icon}</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h3>
                    <div className="text-3xl font-bold text-blue-500 mb-4">{product.price}</div>
                    <p className="text-gray-600 mb-4">{product.bestFor}</p>
                    <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">{product.includes}</p>
                  </div>
                  
                  <Link href={`/editor?product=${product.id}`} className="block">
                    <Button className="w-full py-3 text-base font-semibold bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                      Start {product.title}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Document Packages & Requirements */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Document Packages & Funder Requirements
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                See exactly what documents you get and what funders require for each funding type
              </p>
            </div>

            {/* Funding Type Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {fundingTypes.map((fundingType) => (
                <div key={fundingType.id} className={`bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300 ${
                  recommendedTypes.includes(fundingType.id) || recommendedTypes.includes('all') 
                    ? 'ring-2 ring-blue-100' : ''
                }`}>
                  <div className="text-center mb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                      fundingType.color === 'green' ? 'bg-green-100' :
                      fundingType.color === 'blue' ? 'bg-blue-100' :
                      fundingType.color === 'purple' ? 'bg-purple-100' :
                      'bg-orange-100'
                    }`}>
                      <fundingType.icon className={`w-8 h-8 ${
                        fundingType.color === 'green' ? 'text-green-600' :
                        fundingType.color === 'blue' ? 'text-blue-600' :
                        fundingType.color === 'purple' ? 'text-purple-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{fundingType.title}</h3>
                    <p className="text-sm text-gray-600">{fundingType.description}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Requirements:</h4>
                      <p className="text-xs text-gray-600">{fundingType.requirements}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Language:</h4>
                      <p className="text-xs text-gray-600">{fundingType.language}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Expertise:</h4>
                      <p className="text-xs text-gray-600">{fundingType.expertise}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Product Details with Document Counts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {coreProducts.map((product) => (
                <div key={product.id} className="bg-gray-50 rounded-2xl p-8">
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-3">{product.icon}</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h3>
                    <div className="text-3xl font-bold text-blue-500 mb-4">{product.price}</div>
                    <p className="text-gray-600 mb-4">{product.bestFor}</p>
                    <p className="text-sm text-gray-500 bg-white p-3 rounded-lg">{product.includes}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 text-lg mb-3">Documents by Funding Type:</h4>
                    {Object.entries(documentCounts[product.id as keyof typeof documentCounts]).map(([fundingType, description]) => {
                      const fundingTypeData = fundingTypes.find(ft => ft.id === fundingType);
                      return (
                        <div key={fundingType} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center mb-2">
                            {fundingTypeData && (
                              <fundingTypeData.icon className={`w-5 h-5 mr-2 ${
                                fundingTypeData.color === 'green' ? 'text-green-600' :
                                fundingTypeData.color === 'blue' ? 'text-blue-600' :
                                fundingTypeData.color === 'purple' ? 'text-purple-600' :
                                'text-orange-600'
                              }`} />
                            )}
                            <h5 className="font-semibold text-gray-900">{fundingTypeData?.title}</h5>
                          </div>
                          <p className="text-sm text-gray-600">{description}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Additional Documents Details */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-2">Additional Documents Include:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Executive One-Pager (DE/EN)</li>
                      <li>• PDF & DOCX formats</li>
                      <li>• Financial models (Excel)</li>
                      <li>• CV templates & guidance</li>
                      <li>• Compliance checklists</li>
                      {product.id === 'submission' && (
                        <>
                          <li>• Pitch deck content pack</li>
                          <li>• Cap table templates</li>
                          <li>• Bank summary pages</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Austrian/EU Expertise Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Built for Austrian & EU Funding
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Our documents are specifically designed for Austrian and EU funding requirements
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center mb-3">
                  <Shield className="w-6 h-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">AWS Template-Ready</h3>
                </div>
                <p className="text-sm text-green-800">25pp + structured pitch deck format, aligned with AWS requirements</p>
              </div>

              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center mb-3">
                  <FileCheck className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-blue-900">FFG eCall-Aligned</h3>
                </div>
                <p className="text-sm text-blue-800">Kostenleitfaden categories, overheads, and cost structure compliance</p>
              </div>

              <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center mb-3">
                  <Globe className="w-6 h-6 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-purple-900">Horizon Europe Part B</h3>
                </div>
                <p className="text-sm text-purple-800">Excellence / Impact / Implementation sections with EU terminology</p>
              </div>

              <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-center mb-3">
                  <Award className="w-6 h-6 text-orange-600 mr-3" />
                  <h3 className="text-lg font-semibold text-orange-900">Austrian Banks</h3>
                </div>
                <p className="text-sm text-orange-800">Equity ratio (20–30%) & DSCR tables with WKO terminology</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center mb-3">
                  <Plane className="w-6 h-6 text-gray-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">RWR Visa-Ready</h3>
                </div>
                <p className="text-sm text-gray-800">€30k own funds, innovation impact, AMS compliance</p>
              </div>

              <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-200">
                <div className="flex items-center mb-3">
                  <FileText className="w-6 h-6 text-indigo-600 mr-3" />
                  <h3 className="text-lg font-semibold text-indigo-900">Quality & Compliance</h3>
                </div>
                <p className="text-sm text-indigo-800">Cover page, TOC, auto-numbered sections, Austrian terminology</p>
              </div>
            </div>
          </div>
        </section>

        {/* Add-ons Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Add-ons
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Enhance your plan with additional services
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {addons.map((addon, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <addon.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">{addon.name}</h3>
                  <div className="text-xl font-bold text-blue-500">{addon.price}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to Use Guide */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                How to Use This Page
              </h2>
              <p className="text-lg text-gray-600">
                Simple 5-step process to get your funding-ready documents
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                {
                  icon: CheckCircle,
                  title: "Pick your plan",
                  description: "Strategy, Review, Submission"
                },
                {
                  icon: Building2,
                  title: "Select funding type",
                  description: "Grants, Bank, Equity, Visa"
                },
                {
                  icon: FileText,
                  title: "See included docs",
                  description: "Counts & descriptions above"
                },
                {
                  icon: Plus,
                  title: "Add extras",
                  description: "Rush, consultation, translation"
                },
                {
                  icon: Download,
                  title: "Apply with confidence",
                  description: "Aligned with Austrian/EU standards"
                }
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                  {index < 4 && (
                    <div className="hidden md:block mt-4">
                      <ArrowRight className="w-6 h-6 text-gray-400 mx-auto" />
                    </div>
                  )}
                </div>
              ))}
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
