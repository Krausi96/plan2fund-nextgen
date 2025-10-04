import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SEOHead from '@/components/common/SEOHead';
import { DocumentModal } from '@/components/pricing/DocumentModal';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// Document library data - this should match the pricing page data
const documentLibrary = {
  // Strategy Documents
  businessModelCanvas: {
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
  goToMarketStrategy: {
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
  fundingMatchSummary: {
    id: "fundingMatchSummary",
    name: "Funding Fit Summary",
    description: "Personalised memo with matched Austrian/EU programs, banks, or investors",
    purpose: "Help founders focus on funders that match stage/sector.",
    sections: ["Top 3–5 Austrian/EU programs, banks, or investors", "fit rationale", "next steps"],
    inputs: "Stage, sector, funding need",
    outputs: "2–3 page memo (PDF)",
    limits: "Overview only, not a grant application or loan term sheet",
    formatHints: ["PDF", "2-3 pages", "Personalized"]
  },
  // Review Documents
  reviewedBusinessPlan: {
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
  complianceNotes: {
    id: "complianceNotes",
    name: "Compliance Notes",
    description: "Short checklist showing how your plan aligns with funder requirements",
    purpose: "Show your plan's alignment with specific funding criteria.",
    sections: ["Page-limit checks", "mandatory headings (grants)", "DSCR/ratios (banks)", "cap table/traction (investors)", "RWR criteria (visa)"],
    inputs: "Funder type you target",
    outputs: "1–2 page PDF appendix",
    limits: "Advisory, does not guarantee acceptance",
    formatHints: ["PDF", "1-2 page appendix", "Funder-specific checks"]
  },
  // Submission Documents
  businessPlan: {
    id: "businessPlan",
    name: "Full Business Plan",
    description: "Austrian/EU style, complete and submission-ready",
    purpose: "Main application document, required in all funding types.",
    sections: ["Exec Summary", "Product/Service", "Market", "Competition", "Business Model", "Team", "Operations", "Financials", "Risks", "Ask"],
    inputs: "Business details, costs, traction",
    outputs: "20–30 pages DOCX/PDF (DE/EN)",
    limits: "No audited statements, no notarisation",
    formatHints: ["DOCX/PDF", "20-30 pages", "Professional layout"]
  },
  // Companion Documents - Grants
  workPlanGantt: {
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
  budget: {
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
  cvs: {
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
  annexGuidance: {
    id: "annexGuidance",
    name: "Annex Guidance",
    description: "Step-by-step instructions on annexes you must attach",
    purpose: "Step-by-step instructions on annexes you must attach.",
    sections: ["Required annexes", "format requirements", "submission checklist", "deadlines"],
    inputs: "Funding call requirements",
    outputs: "1–2 page checklist",
    limits: "Guidance only, not actual annexes",
    formatHints: ["PDF", "1-2 page checklist", "Step-by-step"]
  },
  // Companion Documents - Banks
  financialModel: {
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
  bankSummary: {
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
  amortization: {
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
  collateralSheet: {
    id: "collateralSheet",
    name: "Collateral Sheet",
    description: "Assets available as security",
    purpose: "Assets available as security.",
    sections: ["Asset inventory", "valuation", "liquidity", "security ranking"],
    inputs: "Asset details, valuations",
    outputs: "PDF",
    limits: "Asset list only, not valuations",
    formatHints: ["PDF", "Asset inventory", "Security assessment"]
  },
  // Companion Documents - Investors
  pitchDeck: {
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
  teaser: {
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
  fiveYearModel: {
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
  capTable: {
    id: "capTable",
    name: "Cap Table",
    description: "Current and proposed ownership structure",
    purpose: "Current and proposed ownership structure.",
    sections: ["Current ownership", "investment rounds", "option pool", "post-money structure"],
    inputs: "Current ownership, investment terms",
    outputs: "XLSX + PDF",
    limits: "Structure only, not legal documents",
    formatHints: ["XLSX/PDF", "Ownership table", "Investment structure"]
  },
  // Companion Documents - Visa
  visaPlan: {
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
  founderCV: {
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
  evidenceChecklist: {
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
};

export default function Library() {
  const router = useRouter();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const { doc } = router.query;
    if (doc && typeof doc === 'string' && documentLibrary[doc as keyof typeof documentLibrary]) {
      const document = documentLibrary[doc as keyof typeof documentLibrary];
      setSelectedDocument(document);
      setIsModalOpen(true);
    }
  }, [router.query]);

  const handleDocumentClick = (document: any) => {
    setSelectedDocument(document);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
    // Update URL to remove doc parameter
    router.push('/library', undefined, { shallow: true });
  };

  // Group documents by category
  const documentCategories = {
    'Strategy Documents': ['businessModelCanvas', 'goToMarketStrategy', 'fundingMatchSummary'],
    'Review Documents': ['reviewedBusinessPlan', 'complianceNotes'],
    'Core Submission Documents': ['businessPlan'],
    'Grants Companion Docs': ['workPlanGantt', 'budget', 'cvs', 'annexGuidance'],
    'Bank Companion Docs': ['financialModel', 'bankSummary', 'amortization', 'collateralSheet'],
    'Investor Companion Docs': ['pitchDeck', 'teaser', 'fiveYearModel', 'capTable'],
    'Visa Companion Docs': ['visaPlan', 'founderCV', 'evidenceChecklist']
  };

  return (
    <>
      <SEOHead pageKey="library" schema="faq" />
      
      <main className="bg-gray-50 min-h-screen">
        {/* Header */}
        <section className="bg-white py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/pricing" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Pricing</span>
              </Link>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Document Library
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl">
              Explore all the documents we create for you. Click on any document to see detailed specifications.
            </p>
          </div>
        </section>

        {/* Document Categories */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="space-y-12">
              {Object.entries(documentCategories).map(([categoryName, docIds]) => (
                <div key={categoryName}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    {categoryName}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {docIds.map((docId) => {
                      const doc = documentLibrary[docId as keyof typeof documentLibrary];
                      if (!doc) return null;
                      
                      return (
                        <button
                          key={docId}
                          onClick={() => handleDocumentClick(doc)}
                          className="text-left p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {doc.name}
                            </h3>
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          </div>
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                            {doc.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                            <span>View Details</span>
                            <ArrowLeft className="w-3 h-3 rotate-180 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Document Modal */}
        <DocumentModal
          isOpen={isModalOpen}
          onClose={closeModal}
          document={selectedDocument}
        />
      </main>
    </>
  );
}
