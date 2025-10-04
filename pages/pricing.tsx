import Link from "next/link";
import { Button } from "@/components/ui/button";
import CTAStrip from "@/components/common/CTAStrip";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";
import { detectTargetGroup } from "@/lib/targetGroupDetection";
import { useState, useEffect } from "react";
import { 
  ArrowRight
} from "lucide-react";
import { RequirementsMatrix } from "@/components/pricing/RequirementsMatrix";
import { ProofSection } from "@/components/pricing/ProofSection";
import { AddonsSection } from "@/components/pricing/AddonsSection";
import { HowItWorksSection } from "@/components/pricing/HowItWorksSection";
import { type Product, type FundingType, type TargetGroup } from "@/data/basisPack";

// Core Products Data - Updated to match BASIS PACK
const coreProducts = [
  {
    id: "strategy",
    title: "Strategy Plan",
    price: "€99",
    bestFor: "Idea-stage founders exploring funding options",
    includes: "3 documents: Strategy Brief (5-7 pages), Business Model Canvas, Funding Match Summary",
    documents: [
      {
        name: "Strategy Brief",
        description: "Core strategy document with Executive Summary, Problem & Solution, Target Market, Business Model, Financial Projections, and Funding Ask",
        pages: "5-7 pages",
        formats: "DOCX + PDF"
      },
      {
        name: "Business Model Canvas", 
        description: "Visual framework showing Value Propositions, Customer Segments, Revenue Streams, Key Resources, and Cost Structure",
        pages: "1 page visual",
        formats: "PDF"
      },
      {
        name: "Funding Match Summary",
        description: "Personalized funding recommendations with fit analysis and next steps for Austrian/EU funding landscape",
        pages: "2-3 pages",
        formats: "PDF"
      }
    ],
    icon: "💡",
    color: "blue"
  },
  {
    id: "review", 
    title: "Review Plan",
    price: "€149",
    bestFor: "Founders with a draft plan needing polish",
    includes: "3 documents: Annotated Draft, Revised Plan, Compliance Checklist",
    documents: [
      {
        name: "Annotated Draft",
        description: "Your existing plan with line-by-line comments, suggestions, and improvement notes",
        pages: "Your original + comments",
        formats: "DOCX with track changes"
      },
      {
        name: "Revised Plan",
        description: "Completely reworked plan incorporating all feedback and improvements",
        pages: "5-30 pages (depending on original)",
        formats: "DOCX + PDF"
      },
      {
        name: "Compliance Checklist",
        description: "Requirements verification checklist ensuring plan meets funding type requirements",
        pages: "1 page interactive",
        formats: "PDF"
      }
    ],
    icon: "✏️",
    color: "green"
  },
  {
    id: "submission",
    title: "Submission Plan", 
    price: "€199",
    bestFor: "Ready-to-apply founders",
    includes: "5+ documents: Full Business Plan, Work Plan & Gantt, Budget Sheet, CVs, Annex Guidance",
    documents: [
      {
        name: "Full Business Plan",
        description: "Complete Austrian-style business plan with all sections: Executive Summary, Market Analysis, Go-to-Market Strategy, Team, Operations, Financials",
        pages: "20-30 pages",
        formats: "DOCX + PDF"
      },
      {
        name: "Work Plan & Gantt Chart",
        description: "Project timeline and deliverables for grant applications with visual Gantt chart",
        pages: "5-10 pages + visual timeline",
        formats: "DOCX + PDF + Gantt image"
      },
      {
        name: "Budget Sheet",
        description: "Detailed financial breakdown with EU cost categories and funding calculations",
        pages: "2-3 pages",
        formats: "Excel + PDF"
      },
      {
        name: "Founder CVs",
        description: "Professional CVs tailored to funding requirements with Austrian/EU format",
        pages: "2-3 pages per founder",
        formats: "DOCX + PDF"
      },
      {
        name: "Annex Guidance",
        description: "Step-by-step guide for additional documents you need to provide",
        pages: "1-2 pages",
        formats: "PDF"
      }
    ],
    icon: "📚",
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
  
  useEffect(() => {
    const detection = detectTargetGroup();
    setTargetGroup(mapTargetGroup(detection.targetGroup));
  }, []);

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
                    <div className="text-3xl font-bold text-blue-500 mb-4">{product.price}</div>
                    <p className="text-gray-600 mb-4">{product.bestFor}</p>
                    <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg mb-4">{product.includes}</p>
                    
                    {/* Document Details */}
                    <div className="text-left">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">What you get:</h4>
                      <div className="space-y-2">
                        {product.documents.map((doc, index) => (
                          <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <div className="font-medium text-gray-800">{doc.name}</div>
                            <div className="text-gray-600">{doc.description}</div>
                            <div className="text-gray-500 mt-1">{doc.pages} • {doc.formats}</div>
                          </div>
                        ))}
                      </div>
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
    </>
  );
}
