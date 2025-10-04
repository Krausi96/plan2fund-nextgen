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
import { RequirementsMatrix } from "@/components/pricing/RequirementsMatrix";
import { ProofSection } from "@/components/pricing/ProofSection";
import { AddonsSection } from "@/components/pricing/AddonsSection";
import { HowItWorksSection } from "@/components/pricing/HowItWorksSection";
import { DocumentModal } from "@/components/pricing/DocumentModal";
import { type Product, type FundingType, type TargetGroup } from "@/data/basisPack";

// Core Products Data - Updated with new structure
const coreProducts = [
  {
    id: "strategy",
    title: "Strategy Plan",
    price: "€99",
    bestFor: "Idea-stage founders exploring funding options",
    includes: "Business Model Canvas, Go-to-Market Strategy, Funding Fit Summary",
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
    title: "Review Plan",
    price: "€149",
    bestFor: "Founders with a draft plan needing polish",
    includes: "Reviewed & Revised Business Plan, Compliance Notes",
    documents: [
      {
        id: "reviewedBusinessPlan",
        name: "Reviewed & Revised Business Plan",
        description: "Fixed, restructured, and clean version of your draft",
        purpose: "Deliver a professional, funder-ready plan.",
        sections: ["Same as business plan structure (Exec Summary, Market, Product, Team, Financials, Ask)"],
        inputs: "Your draft + missing data",
        outputs: "Clean DOCX/PDF + tracked-change version",
        limits: "Based on what you provide (no new market research)",
        formatHints: ["DOCX/PDF", "Clean version + tracked changes", "Professional formatting"]
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
    title: "Submission Plan", 
    price: "€199",
    bestFor: "Ready-to-apply founders",
    includes: "Full Business Plan + Companion Docs (by funding type)",
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
      grants: ["Work Plan & Gantt", "Budget", "CVs", "Annex Guidance"],
      banks: ["Financial Model", "Bank Summary", "Amortization", "Collateral Sheet"],
      investors: ["Pitch Deck", "Teaser", "5y Model", "Cap Table"],
      visa: ["Visa Plan", "Founder CV", "Evidence Checklist"]
    },
    icon: "🚀",
    color: "purple"
  }
];

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

// Funding Type Packages - Updated to match BASIS PACK
const fundingTypes = [
  {
    id: "grants",
    title: "Grants",
    description: "Austrian & EU grant applications",
    icon: "🏛️",
    color: "green",
    language: "German default, English toggle",
    requirements: "Plan + work plan & budget + CVs/annexes (as per call)",
    expertise: "AWS, FFG, Horizon Europe, Regional Grants"
  },
  {
    id: "bankLoans", 
    title: "Bank Loans",
    description: "Austrian bank financing",
    icon: "💰",
    color: "blue", 
    language: "German default",
    requirements: "Plan + 3–5y model + ratios/repayment + collateral",
    expertise: "Austrian Banking Standards, WKO Guidelines"
  },
  {
    id: "equity",
    title: "Equity Investment", 
    description: "Venture capital & angel investors",
    icon: "💼",
    color: "purple",
    language: "English default, German optional",
    requirements: "Plan + teaser/deck + 5y model + cap table",
    expertise: "Austrian/EU VC Landscape, Investment Standards"
  },
  {
    id: "visa",
    title: "Visa (RWR)",
    description: "Red-White-Red visa applications", 
    icon: "✈️",
    color: "orange",
    language: "English default, German toggle",
    requirements: "Visa plan + CV + evidence checklist (capital, jobs, qualifications)",
    expertise: "Austrian Immigration Law, AMS Requirements"
  }
];


export default function Pricing() {
  const { t } = useI18n();
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('startups');
  const [selectedFundingType, setSelectedFundingType] = useState<FundingType>('grants');
  const [selectedProduct, setSelectedProduct] = useState<Product>('strategy');
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  
  useEffect(() => {
    const detection = detectTargetGroup();
    setTargetGroup(mapTargetGroup(detection.targetGroup));
  }, []);

  const handleDocumentClick = (document: any) => {
    setSelectedDocument(document);
    setIsModalOpen(true);
  };

  const toggleExpanded = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

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
                    <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full mb-4">
                      <span className="text-2xl font-bold text-gray-900">{product.price}</span>
                      <span className="text-sm text-gray-500 ml-2">incl. VAT</span>
                    </div>
                    <p className="text-gray-600 mb-4 text-sm font-medium">{product.bestFor}</p>
                    <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg mb-4">{product.includes}</p>
                    
                    {/* Document Details - Collapsible */}
                    <div className="text-left">
                      <button
                        onClick={() => toggleExpanded(product.id)}
                        className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 mb-3 hover:text-blue-600 transition-colors"
                      >
                        <span>What you get:</span>
                        {expandedProduct === product.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      
                      {expandedProduct === product.id && (
                        <div className="space-y-2">
                          {product.documents.map((doc, index) => (
                            <button
                              key={index}
                              onClick={() => handleDocumentClick(doc)}
                              className="w-full text-left text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 p-3 rounded transition-colors"
                            >
                              <div className="font-medium text-gray-800 mb-1">{doc.name}</div>
                              <div className="text-gray-600">{doc.description}</div>
                              <div className="text-gray-500 mt-1 flex items-center gap-1">
                                <span>Click for details</span>
                                <ArrowRight className="w-3 h-3" />
                              </div>
                            </button>
                          ))}
                          
                          {/* Companion Docs for Submission Plan */}
                          {product.id === 'submission' && product.companionDocs && (
                            <div className="mt-4">
                              <h5 className="text-xs font-semibold text-gray-800 mb-2">Companion Docs (by funding type):</h5>
                              <div className="space-y-1">
                                {Object.entries(product.companionDocs).map(([type, docs]) => (
                                  <div key={type} className="text-xs">
                                    <span className="font-medium text-gray-700 capitalize">{type}:</span>
                                    <span className="text-gray-600 ml-1">{docs.join(', ')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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

            {/* Simplified Filters */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {/* Funding Type Filter */}
              <div className="flex flex-wrap gap-2">
                {fundingTypes.map((fundingType) => (
                  <button
                    key={fundingType.id}
                    onClick={() => setSelectedFundingType(fundingType.id as FundingType)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedFundingType === fundingType.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-lg">{fundingType.icon}</span>
                    <span>{fundingType.title}</span>
                  </button>
                ))}
              </div>

              {/* Product Filter */}
              <div className="flex flex-wrap gap-2">
                {coreProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product.id as Product)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedProduct === product.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-lg">{product.icon}</span>
                    <span>{product.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Requirements Matrix */}
            <RequirementsMatrix
              targetGroup={targetGroup}
              fundingType={selectedFundingType}
              product={selectedProduct}
            />
          </div>
        </section>

        {/* Proof Section */}
        <ProofSection />

        {/* Add-ons Section */}
        <AddonsSection fundingType={selectedFundingType} />

        {/* How It Works Section */}
        <HowItWorksSection />

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

      {/* Document Modal */}
      <DocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        document={selectedDocument}
      />
    </>
  );
}
