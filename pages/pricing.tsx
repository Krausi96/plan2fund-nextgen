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
  Zap, 
  Calculator, 
  MessageCircle, 
  Presentation,
  Globe,
  CheckCircle,
  Download,
  Plus
} from "lucide-react";
import { documentBundles } from "@/data/documentBundles";
import { DocumentTag } from "@/components/pricing/DocumentTag";

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
    icon: "📚",
    color: "purple"
  }
];

// Helper function to get document count and description
const getDocumentInfo = (productId: string, fundingType: string) => {
  const bundle = documentBundles[productId as keyof typeof documentBundles]?.[fundingType as keyof typeof documentBundles.strategy];
  const documents = bundle?.documents || [];
  const count = documents.length;
  const optionalCount = documents.filter(doc => doc.startsWith('optional')).length;
  const requiredCount = count - optionalCount;
  
  return {
    count,
    requiredCount,
    optionalCount,
    documents
  };
};

// Funding Type Packages
const fundingTypes = [
  {
    id: "grants",
    title: "Grants",
    description: "Austrian & EU grant applications",
    icon: "🏛️",
    color: "green",
    language: "German default, English toggle",
    requirements: "Business Plan, Work Plan & Gantt, Budget Sheet, CVs, Annexes",
    expertise: "AWS, FFG, Horizon Europe, Regional Grants"
  },
  {
    id: "bankLoans", 
    title: "Bank Loans",
    description: "Austrian bank financing",
    icon: "💰",
    color: "blue", 
    language: "German default",
    requirements: "Business Plan, Financials, Repayment Schedule, Collateral",
    expertise: "Austrian Banking Standards, WKO Guidelines"
  },
  {
    id: "equity",
    title: "Equity Investment", 
    description: "Venture capital & angel investors",
    icon: "💼",
    color: "purple",
    language: "English default, German optional",
    requirements: "Pitch Deck, One-pager Teaser, Cap Table, 5y Model",
    expertise: "Austrian/EU VC Landscape, Investment Standards"
  },
  {
    id: "visa",
    title: "Visa (RWR)",
    description: "Red-White-Red visa applications", 
    icon: "✈️",
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
                  <span className="text-lg">{group.icon}</span>
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
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      product.color === 'blue' ? 'bg-blue-100' :
                      product.color === 'green' ? 'bg-green-100' :
                      'bg-purple-100'
                    }`}>
                      <span className="text-3xl">{product.icon}</span>
                    </div>
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
                      <span className="text-3xl">{fundingType.icon}</span>
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
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      product.color === 'blue' ? 'bg-blue-100' :
                      product.color === 'green' ? 'bg-green-100' :
                      'bg-purple-100'
                    }`}>
                      <span className="text-3xl">{product.icon}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h3>
                    <div className="text-3xl font-bold text-blue-500 mb-4">{product.price}</div>
                    <p className="text-gray-600 mb-4">{product.bestFor}</p>
                    <p className="text-sm text-gray-500 bg-white p-3 rounded-lg">{product.includes}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 text-lg mb-3">Documents by Funding Type:</h4>
                    {fundingTypes.map((fundingType) => {
                      const docInfo = getDocumentInfo(product.id, fundingType.id);
                      return (
                        <div key={fundingType.id} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center mb-3">
                            <span className="text-lg mr-2">{fundingType.icon}</span>
                            <h5 className="font-semibold text-gray-900">{fundingType.title}</h5>
                            <span className="ml-auto text-sm text-gray-500">
                              {docInfo.requiredCount} docs
                              {docInfo.optionalCount > 0 && ` + ${docInfo.optionalCount} optional`}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {docInfo.documents.slice(0, 3).map((docId) => (
                              <DocumentTag
                                key={docId}
                                document={{
                                  id: docId,
                                  i18nKey: `documents.${docId}`,
                                  title: docId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                                  short: `${docId} description`,
                                  details: `${docId} detailed description`,
                                  formatHints: ['PDF', 'DOCX'],
                                  category: 'strategy',
                                  fundingTypes: [fundingType.id as 'grants' | 'bankLoans' | 'equity' | 'visa']
                                }}
                                variant="included"
                                size="sm"
                                showTooltip={false}
                              />
                            ))}
                            {docInfo.documents.length > 3 && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                +{docInfo.documents.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Additional Requirements */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-3">You'll Need to Provide:</h5>
                    <div className="space-y-2">
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-1">General Requirements:</h6>
                        <ul className="text-xs text-gray-600 space-y-1">
                          <li>• Business registration documents</li>
                          <li>• Financial statements (if applicable)</li>
                          <li>• Team CVs and qualifications</li>
                          <li>• Proof of funds or investment</li>
                        </ul>
                      </div>
                    </div>
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
              <p className="text-lg text-gray-600 max-w-4xl mx-auto">
                Plan2Fund is designed around the real requirements of Austrian and EU funding bodies, banks, and investors.<br/>
                Every document is generated to match <strong>local standards and expectations</strong> across all major funding routes:
              </p>
            </div>

            {/* Funding Routes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center mb-3">
                  <FileText className="w-6 h-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">Public Grants</h3>
                </div>
                <p className="text-sm text-green-800">Structured business plans, work packages, and budgets aligned with Austrian agencies and EU programs.</p>
              </div>

              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center mb-3">
                  <span className="text-lg mr-3">💰</span>
                  <h3 className="text-lg font-semibold text-blue-900">Bank Loans & Leasing</h3>
                </div>
                <p className="text-sm text-blue-800">Loan-ready plans including financial ratios, repayment schedules, and collateral sheets in line with Austrian banking practice.</p>
              </div>

              <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center mb-3">
                  <span className="text-lg mr-3">💼</span>
                  <h3 className="text-lg font-semibold text-purple-900">Investors & VC</h3>
                </div>
                <p className="text-sm text-purple-800">Investor teasers, pitch content, cap tables, and growth projections in the format equity partners expect.</p>
              </div>

              <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-center mb-3">
                  <span className="text-lg mr-3">✈️</span>
                  <h3 className="text-lg font-semibold text-orange-900">Visa & Residency</h3>
                </div>
                <p className="text-sm text-orange-800">Business plans highlighting innovation, investment capital, and economic benefit, tailored for Austrian immigration authorities.</p>
              </div>
            </div>

            {/* Quality & Compliance */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Quality & Compliance</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Page limits & required sections enforced</h4>
                  <p className="text-sm text-gray-600">No risk of rejection for format errors</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calculator className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Financials built with Austrian accounting terms</h4>
                  <p className="text-sm text-gray-600">Umsatz, Eigenkapitalquote, DSCR</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Bilingual output</h4>
                  <p className="text-sm text-gray-600">German/English depending on funder requirements</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Structured for easy copy-paste</h4>
                  <p className="text-sm text-gray-600">Into official templates & portals</p>
                </div>
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
                  icon: "🏛️",
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
                    {typeof step.icon === 'string' ? (
                      <span className="text-3xl">{step.icon}</span>
                    ) : (
                      <step.icon className="w-8 h-8 text-blue-600" />
                    )}
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
