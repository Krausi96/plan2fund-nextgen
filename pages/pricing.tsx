import Link from "next/link";
import { Button } from "@/components/ui/button";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";
import { detectTargetGroup } from "@/lib/targetGroupDetection";
import { useState, useEffect } from "react";
import { 
  ArrowRight, 
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { RequirementsDisplay } from "@/components/pricing/RequirementsDisplay";
import { FilterTabs } from "@/components/pricing/FilterTabs";
import { FilterTabContent } from "@/components/pricing/FilterTabContent";
import { ProofSection } from "@/components/pricing/ProofSection";
import { AddonsSection } from "@/components/pricing/AddonsSection";
import { type Product, type FundingType, type TargetGroup } from "@/data/basisPack";
import analytics from "@/lib/analytics";


// Helper function to map target group detection to BASIS PACK types
const mapTargetGroup = (detectedGroup: string): TargetGroup => {
  switch (detectedGroup) {
    case 'startups': return 'startups';
    case 'sme': return 'sme';
    case 'advisors': return 'advisors';
    case 'universities': return 'universities';
    default: return 'startups';
  }
};



export default function Pricing() {
  const { t } = useI18n();
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('startups');
  const [selectedFundingType, setSelectedFundingType] = useState<FundingType>('grants');
  const [selectedProduct, setSelectedProduct] = useState<Product>('strategy');
  const [activeTab, setActiveTab] = useState<'product' | 'funding' | 'target'>('product');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  
  useEffect(() => {
    const detection = detectTargetGroup();
    setTargetGroup(mapTargetGroup(detection.targetGroup));
    analytics.trackPageView('/pricing', 'Pricing');
  }, []);

  // Core Products Data - Updated with new structure
const coreProducts = [
  {
    id: "strategy",
      title: t('pricing.products.strategy.title'),
    price: "€99",
      bestFor: t('pricing.strategy.bestFor'),
      includes: t('pricing.includes.strategy'),
      documents: [
        {
          id: "businessModelCanvas",
          name: "Business Model Canvas",
          description: "Visual framework of your business model",
          purpose: "Show value creation in one page, used in early-stage grants/investors.",
          sections: ["Value Propositions", "Customer Segments", "Channels", "Revenue Streams", "Cost Structure", "Key Resources", "Key Activities", "Partners"],
          inputs: "Your product idea, market, cost/price assumptions",
          outputs: "1-page visual (PDF)",
          limits: "High-level, not a substitute for a business plan",
          formatHints: ["PDF", "1 page", "Visual format"]
        },
        {
          id: "goToMarketStrategy",
          name: "Go-to-Market Strategy",
          description: "First traction roadmap & customer acquisition plan",
          purpose: "Explain how you reach first customers and prove traction.",
          sections: ["ICP (ideal customer profile)", "positioning", "marketing channels", "first sales steps", "6–12m traction goals"],
          inputs: "Target market, sales/marketing ideas, budget",
          outputs: "2–3 pages (DOCX/PDF)",
          limits: "Early roadmap, not a detailed sales ops plan",
          formatHints: ["DOCX/PDF", "2-3 pages", "Strategic roadmap"]
        },
        {
          id: "fundingMatchSummary",
          name: "Funding Fit Summary",
          description: "Personalised memo with matched Austrian/EU programs, banks, or investors",
          purpose: "Help founders focus on funders that match stage/sector.",
          sections: ["Top 3–5 Austrian/EU programs, banks, or investors", "fit rationale", "next steps"],
          inputs: "Stage, sector, funding need",
          outputs: "2–3 page memo (PDF)",
          limits: "Overview only, not a grant application or loan term sheet",
          formatHints: ["PDF", "2-3 pages", "Personalized"]
        }
      ],
      icon: "🎯",
    color: "blue"
  },
  {
    id: "review", 
      title: t('pricing.products.review.title'),
    price: "€149",
      bestFor: t('pricing.review.bestFor'),
      includes: t('pricing.includes.review'),
      documents: [
        {
          id: "reviewedBusinessPlan",
          name: "Reviewed & Revised Business Plan",
          description: "Fixed, restructured, and clean version of your draft",
          purpose: "Deliver a professional, funder-ready plan.",
          sections: ["Same as business plan structure (Exec Summary, Market, Product, Team, Financials, Ask)"],
          inputs: "Your existing draft text, target funding route",
          outputs: "15–30 pages DOCX/PDF (DE/EN)",
          limits: "Revision only, not a complete rewrite from scratch",
          formatHints: ["DOCX/PDF", "15-30 pages", "Professional layout"]
        },
        {
          id: "complianceNotes",
          name: "Compliance Notes",
          description: "Short checklist showing how your plan aligns with funder requirements",
          purpose: "Show your plan's alignment with specific funding criteria.",
          sections: ["Page-limit checks", "mandatory headings (grants)", "DSCR/ratios (banks)", "cap table/traction (investors)", "RWR criteria (visa)"],
          inputs: "Funder type you target",
          outputs: "1–2 page PDF appendix",
          limits: "Advisory, does not guarantee acceptance",
          formatHints: ["PDF", "1-2 page appendix", "Funder-specific checks"]
        }
      ],
      icon: "📝",
    color: "green"
  },
  {
    id: "submission",
      title: t('pricing.products.submission.title'),
    price: "€199",
      bestFor: t('pricing.submission.bestFor'),
      includes: t('pricing.includes.submission'),
      documents: [
        {
          id: "businessPlan",
          name: "Full Business Plan",
          description: "Austrian/EU style, complete and submission-ready",
          purpose: "Main application document, required in all funding types.",
          sections: ["Exec Summary", "Product/Service", "Market", "Competition", "Business Model", "Team", "Operations", "Financials", "Risks", "Ask"],
          inputs: "Business details, costs, traction",
          outputs: "20–30 pages DOCX/PDF (DE/EN)",
          limits: "No audited statements, no notarisation",
          formatHints: ["DOCX/PDF", "20-30 pages", "Professional layout"]
        }
      ],
      companionDocs: {
        grants: [
          {
            id: "workPlanGantt",
            name: "Work Plan & Gantt",
            description: "Show feasibility & timeline",
            purpose: "Show feasibility & timeline.",
            sections: ["Work packages", "milestones", "deliverables", "Gantt chart"],
            inputs: "Project timeline, work packages, deliverables",
            outputs: "DOCX + Gantt image",
            limits: "High-level planning, not detailed project management",
            formatHints: ["DOCX", "Gantt chart", "Project timeline"]
          },
          {
            id: "budget",
            name: "Budget",
            description: "Detailed EU/AT cost breakdown",
            purpose: "Detailed EU/AT cost breakdown.",
            sections: ["Cost categories", "EU/AT compliance", "justification", "summary"],
            inputs: "Project costs, EU/AT requirements",
            outputs: "XLSX + PDF summary",
            limits: "Cost estimates only, not audited financials",
            formatHints: ["XLSX", "PDF summary", "EU/AT compliant"]
          },
          {
            id: "cvs",
            name: "CVs",
            description: "Show team credibility",
            purpose: "Show team credibility.",
            sections: ["Professional experience", "relevant qualifications", "education", "achievements"],
            inputs: "Team member details, qualifications",
            outputs: "1–2 page DE/EN CVs (funding-compliant)",
            limits: "Professional CVs only, not personal details",
            formatHints: ["DOCX/PDF", "1-2 pages", "DE/EN versions"]
          },
          {
            id: "annexGuidance",
            name: "Annex Guidance",
            description: "Step-by-step instructions on annexes you must attach",
            purpose: "Step-by-step instructions on annexes you must attach.",
            sections: ["Required annexes", "format requirements", "submission checklist", "deadlines"],
            inputs: "Funding call requirements",
            outputs: "1–2 page checklist",
            limits: "Guidance only, not actual annexes",
            formatHints: ["PDF", "1-2 page checklist", "Step-by-step"]
          }
        ],
        banks: [
          {
            id: "financialModel",
            name: "Financial Model",
            description: "Show financial health, DSCR, and growth projections",
            purpose: "Show financial health, DSCR, and growth projections.",
            sections: ["3-5 year projections", "DSCR calculations", "cash flow", "key ratios"],
            inputs: "Historical data, growth assumptions, cost structure",
            outputs: "3–5y XLSX + charts",
            limits: "Projections only, not audited statements",
            formatHints: ["XLSX", "3-5 years", "Financial charts"]
          },
          {
            id: "bankSummary",
            name: "Bank Summary",
            description: "Concise one-pager for credit officers",
            purpose: "Concise one-pager for credit officers.",
            sections: ["Executive summary", "key financials", "collateral", "risk assessment"],
            inputs: "Business plan, financial model",
            outputs: "PDF",
            limits: "Summary only, not full application",
            formatHints: ["PDF", "1 page", "Bank-ready format"]
          },
          {
            id: "amortization",
            name: "Amortization",
            description: "Loan repayment schedule",
            purpose: "Loan repayment schedule.",
            sections: ["Payment schedule", "interest calculations", "principal reduction", "total cost"],
            inputs: "Loan amount, interest rate, term",
            outputs: "XLSX + PDF",
            limits: "Standard calculations only",
            formatHints: ["XLSX/PDF", "Payment schedule", "Bank format"]
          },
          {
            id: "collateralSheet",
            name: "Collateral Sheet",
            description: "Assets available as security",
            purpose: "Assets available as security.",
            sections: ["Asset inventory", "valuation", "liquidity", "security ranking"],
            inputs: "Asset details, valuations",
            outputs: "PDF",
            limits: "Asset list only, not valuations",
            formatHints: ["PDF", "Asset inventory", "Security assessment"]
          }
        ],
        investors: [
          {
            id: "pitchDeck",
            name: "Pitch Deck",
            description: "Slides for investor meetings",
            purpose: "Slides for investor meetings.",
            sections: ["Problem/solution", "market opportunity", "business model", "team", "financials", "ask"],
            inputs: "Business plan, financial model",
            outputs: "Slide text + structure, PDF/PPT export",
            limits: "Presentation only, not full due diligence",
            formatHints: ["PDF/PPT", "10-15 slides", "Investor format"]
          },
          {
            id: "teaser",
            name: "Teaser",
            description: "One-page investment summary",
            purpose: "One-page investment summary.",
            sections: ["Company overview", "key metrics", "investment ask", "use of funds"],
            inputs: "Business highlights, financials",
            outputs: "PDF",
            limits: "Summary only, not detailed analysis",
            formatHints: ["PDF", "1 page", "Executive summary"]
          },
          {
            id: "fiveYearModel",
            name: "5y Model",
            description: "Detailed financial projections",
            purpose: "Detailed financial projections.",
            sections: ["Revenue projections", "cost structure", "cash flow", "key metrics"],
            inputs: "Business assumptions, market data",
            outputs: "XLSX + charts",
            limits: "Projections only, not guarantees",
            formatHints: ["XLSX", "5 years", "Financial model"]
          },
          {
            id: "capTable",
            name: "Cap Table",
            description: "Current and proposed ownership structure",
            purpose: "Current and proposed ownership structure.",
            sections: ["Current ownership", "investment rounds", "option pool", "post-money structure"],
            inputs: "Current ownership, investment terms",
            outputs: "XLSX + PDF",
            limits: "Structure only, not legal documents",
            formatHints: ["XLSX/PDF", "Ownership table", "Investment structure"]
          }
        ],
        visa: [
          {
            id: "visaPlan",
            name: "Visa Plan",
            description: "Show economic benefit for Austria",
            purpose: "Show economic benefit for Austria.",
            sections: ["Economic impact", "job creation", "innovation", "Austria benefits"],
            inputs: "Business details, job plans, economic projections",
            outputs: "15–20 pages DE/EN",
            limits: "Business case only, not legal advice",
            formatHints: ["DOCX/PDF", "15-20 pages", "DE/EN versions"]
          },
          {
            id: "founderCV",
            name: "Founder CV",
            description: "Professional CV for visa application",
            purpose: "Professional CV for visa application.",
            sections: ["Education", "work experience", "achievements", "Austria relevance"],
            inputs: "Professional background, qualifications",
            outputs: "2-3 page DE/EN CV",
            limits: "Professional details only",
            formatHints: ["DOCX/PDF", "2-3 pages", "Visa-compliant format"]
          },
          {
            id: "evidenceChecklist",
            name: "Evidence Checklist",
            description: "Checklist of IDs, funds, proof of jobs",
            purpose: "Checklist of IDs, funds, proof of jobs.",
            sections: ["Required documents", "proof of funds", "job creation evidence", "timeline"],
            inputs: "Personal documents, business evidence",
            outputs: "1 page PDF",
            limits: "Checklist only, not actual documents",
            formatHints: ["PDF", "1 page", "Document checklist"]
          }
        ]
      },
      icon: "🚀",
      color: "purple"
    }
  ];


  const toggleExpanded = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  const getButtonText = (productId: string) => {
    switch (productId) {
      case 'strategy':
        return t('pricing.buttons.startStrategy');
      case 'review':
        return t('pricing.buttons.startReview');
      case 'submission':
        return t('pricing.buttons.startSubmission');
      default:
        return `Start ${productId}`;
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    // Auto-advance to funding tab after product selection
    setActiveTab('funding');
  };

  const handleFundingSelect = (funding: FundingType) => {
    setSelectedFundingType(funding);
    // Auto-advance to target tab after funding selection
    setActiveTab('target');
  };

  const handleTargetSelect = (target: TargetGroup) => {
    setTargetGroup(target);
    // Stay on target tab to allow changes
  };

  return (
    <>
      <SEOHead pageKey="pricing" schema="faq" />
      
      <main className="bg-gray-50">
        {/* Hero Section */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t('pricing.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>
        </section>

        {/* Core Products Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('pricing.coreProducts.title')}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                {t('pricing.coreProducts.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {coreProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 p-8 relative overflow-hidden group">
                  <div className="text-center mb-8">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ${
                      product.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                      product.color === 'green' ? 'bg-gradient-to-br from-blue-400 to-blue-500' :
                      'bg-gradient-to-br from-blue-600 to-blue-700'
                    }`}>
                      <span className="text-4xl text-white">{product.icon}</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-3">{product.title}</h3>
                    <div className="inline-flex items-center px-8 py-4 bg-white border-2 border-black text-black rounded-2xl mb-6 shadow-lg">
                      <span className="text-4xl font-black">{product.price}</span>
                      <span className="text-sm font-medium ml-3">{t('pricing.labels.inclVat')}</span>
                  </div>
                    <p className="text-gray-700 mb-6 text-base font-medium leading-relaxed">{product.bestFor}</p>
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl mb-6 border border-gray-200">
                      <p className="text-sm text-gray-700 font-medium">{product.includes}</p>
            </div>

                    {/* Document Details - Collapsible */}
                    <div className="text-left">
                      <button
                        onClick={() => toggleExpanded(product.id)}
                        className="flex items-center justify-between w-full text-base font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors group"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          {t('pricing.labels.whatYouGet')}
                        </span>
                        {expandedProduct === product.id ? (
                          <ChevronUp className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
                        ) : (
                          <ChevronDown className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
                        )}
                      </button>
                      
                      {expandedProduct === product.id && (
                        <div className="space-y-2">
                          {product.documents.map((doc, index) => (
                            <Link
                              key={index}
                              href={`/library?doc=${doc.id}`}
                              className="block w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{doc.name}</div>
                                  <div className="text-sm text-gray-600 mb-3 leading-relaxed">{doc.description}</div>
                                  <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                                    <span>{t('pricing.buttons.viewLibrary')}</span>
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                    </div>
                                <div className="ml-4">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <ArrowRight className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </div>
                            </Link>
                          ))}
                          
                          {/* Companion Docs for Submission Plan */}
                          {product.id === 'submission' && product.companionDocs && (
                            <div className="mt-6">
                              <h5 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                {t('pricing.labels.companionDocs')}
                              </h5>
                  <div className="space-y-4">
                                {Object.entries(product.companionDocs).map(([type, docs]) => (
                                  <div key={type} className="space-y-2">
                                    <div className="font-semibold text-gray-800 capitalize mb-3 flex items-center gap-2 text-sm">
                                      <span className="text-xl">
                                        {type === 'grants' ? '🏛️' : 
                                         type === 'banks' ? '💰' : 
                                         type === 'investors' ? '💼' : '✈️'}
                            </span>
                                      {type}:
                                    </div>
                                    <div className="space-y-2 ml-6">
                                      {docs.map((doc, index) => (
                                        <Link
                                          key={index}
                                          href={`/library?doc=${doc.id}`}
                                          className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all duration-300 group"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-800 text-sm group-hover:text-purple-600 transition-colors">{doc.name}</span>
                                            <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                          </div>
                                        </Link>
                                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
                          )}
            </div>
                      )}
              </div>
            </div>

                  <Link href={`/editor?product=${product.id}`} className="block mt-8">
                    <Button className={`w-full py-4 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group ${
                      product.color === 'blue' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' :
                      product.color === 'green' ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' :
                      'bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900'
                    }`}>
                      <span>{getButtonText(product.id)}</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements Matrix */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Document Requirements by Funding Type
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                See exactly what documents we create for you and what you need to provide for each funding type
              </p>
            </div>

            {/* Filter Tabs */}
            <FilterTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              selectedProduct={selectedProduct}
              selectedFunding={selectedFundingType}
              selectedTarget={targetGroup}
            />

            {/* Tab Content */}
            <div className="mb-8">
              <FilterTabContent
                activeTab={activeTab}
                selectedProduct={selectedProduct}
                selectedFunding={selectedFundingType}
                selectedTarget={targetGroup}
                onProductSelect={handleProductSelect}
                onFundingSelect={handleFundingSelect}
                onTargetSelect={handleTargetSelect}
              />
                  </div>

            {/* Requirements Display */}
            <RequirementsDisplay
              targetGroup={targetGroup}
              fundingType={selectedFundingType}
              product={selectedProduct}
            />
          </div>
        </section>

        {/* Proof / Snapshots Section */}
        <ProofSection />

        {/* Add-ons Section */}
        <AddonsSection fundingType={selectedFundingType} />

        <CTAStrip
          title={t('cta.readyToStart')}
          subtitle={t('cta.choosePlan')}
          primaryAction={{
            label: t('cta.startPlan'),
            href: "/reco"
          }}
          secondaryAction={{
            label: "Start Editor",
            href: "/editor"
          }}
        />
      </main>

    </>
  );
}
