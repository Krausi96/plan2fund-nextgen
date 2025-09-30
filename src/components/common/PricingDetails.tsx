import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";
import { ChevronDown, ChevronUp, Users, Upload, Download, FileText, CheckCircle } from "lucide-react";

interface PricingDetailProps {
  id: string;
  title: string;
  whoFor: string;
  whoForDesc: string;
  youProvide: string;
  youProvideDesc: string;
  youGet: string;
  youGetDesc: string;
  routeExtras?: string | null;
  routeExtrasDesc?: string | null;
  outline: string;
  outlineDesc: string;
  export: string;
  exportDesc: string;
  cta: string;
  ctaHref: string;
  seeMore: string;
  seeMoreDesc: string;
}

function PricingDetailCard({ 
  id, 
  title, 
  whoFor, 
  whoForDesc, 
  youProvide, 
  youProvideDesc, 
  youGet, 
  youGetDesc, 
  routeExtras,
  routeExtrasDesc,
  outline, 
  outlineDesc, 
  export: exportLabel, 
  exportDesc, 
  cta, 
  ctaHref, 
  seeMore, 
  seeMoreDesc 
}: PricingDetailProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = (id: string) => {
    switch (id) {
      case 'strategy': return '💡'; // Lightbulb for strategy/ideas
      case 'review': return '✏️'; // Edit pencil for review/update
      case 'custom': return '📋'; // Clipboard for submission-ready documents
      default: return '📋';
    }
  };

  const getColorScheme = (id: string) => {
    switch (id) {
      case 'strategy': return 'blue';
      case 'review': return 'green';
      case 'custom': return 'purple';
      default: return 'gray';
    }
  };

  const colorScheme = getColorScheme(id);

  return (
    <article id={id} className="scroll-mt-20 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className={`p-4 sm:p-6 lg:p-8 bg-gradient-to-r ${
        colorScheme === 'blue' ? 'from-blue-50 to-blue-100' :
        colorScheme === 'green' ? 'from-green-50 to-green-100' :
        colorScheme === 'purple' ? 'from-purple-50 to-purple-100' :
        'from-gray-50 to-gray-100'
      }`}>
        <div className="flex items-center mb-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-4 ${
            colorScheme === 'blue' ? 'bg-blue-100' :
            colorScheme === 'green' ? 'bg-green-100' :
            colorScheme === 'purple' ? 'bg-purple-100' :
            'bg-gray-100'
          }`}>
            <span className="text-3xl">{getIcon(id)}</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
            <p className="text-gray-600 mt-1">Complete business planning solution</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Key Information Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-3">
              <Users className={`w-5 h-5 mr-2 ${
                colorScheme === 'blue' ? 'text-blue-600' :
                colorScheme === 'green' ? 'text-green-600' :
                colorScheme === 'purple' ? 'text-purple-600' :
                'text-gray-600'
              }`} />
              <h4 className="font-semibold text-gray-900">{whoFor}</h4>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{whoForDesc}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-3">
              <Upload className={`w-5 h-5 mr-2 ${
                colorScheme === 'blue' ? 'text-blue-600' :
                colorScheme === 'green' ? 'text-green-600' :
                colorScheme === 'purple' ? 'text-purple-600' :
                'text-gray-600'
              }`} />
              <h4 className="font-semibold text-gray-900">{youProvide}</h4>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{youProvideDesc}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-3">
              <CheckCircle className={`w-5 h-5 mr-2 ${
                colorScheme === 'blue' ? 'text-blue-600' :
                colorScheme === 'green' ? 'text-green-600' :
                colorScheme === 'purple' ? 'text-purple-600' :
                'text-gray-600'
              }`} />
              <h4 className="font-semibold text-gray-900">{youGet}</h4>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{youGetDesc}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-3">
              <FileText className={`w-5 h-5 mr-2 ${
                colorScheme === 'blue' ? 'text-blue-600' :
                colorScheme === 'green' ? 'text-green-600' :
                colorScheme === 'purple' ? 'text-purple-600' :
                'text-gray-600'
              }`} />
              <h4 className="font-semibold text-gray-900">{outline}</h4>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{outlineDesc}</p>
          </div>
        </div>

        {/* Route Extras - only for review and custom */}
        {routeExtras && routeExtrasDesc && (
          <div className="bg-blue-50 rounded-xl p-6 mb-8 border border-blue-200">
            <div className="flex items-center mb-3">
              <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
              <h4 className="font-semibold text-blue-900">{routeExtras}</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {routeExtrasDesc.split(', ').map((extra, index) => (
                <span key={index} className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {extra}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Export Information */}
        <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <div className="flex items-center mb-3">
            <Download className="w-5 h-5 mr-2 text-blue-600" />
            <h4 className="font-semibold text-gray-900">{exportLabel}</h4>
          </div>
          <p className="text-gray-700 leading-relaxed">{exportDesc}</p>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 rounded-xl p-6 mb-6">
          <div className="mb-4 sm:mb-0">
            <h4 className="font-semibold text-gray-900 mb-2">Ready to get started?</h4>
            <p className="text-sm text-gray-600">Choose this plan and start building your business plan today.</p>
          </div>
          <Link href={ctaHref} className="w-full sm:w-auto">
            <Button className={`w-full sm:w-auto px-8 py-3 text-base font-semibold ${
              colorScheme === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
              colorScheme === 'green' ? 'bg-green-600 hover:bg-green-700' :
              colorScheme === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
              'bg-gray-600 hover:bg-gray-700'
            }`}>
              {cta}
            </Button>
          </Link>
        </div>

        {/* Expandable Section */}
        <div className="border-t pt-6">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsExpanded(!isExpanded);
              }
            }}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2 -ml-2"
            aria-expanded={isExpanded}
            aria-controls={`${id}-details`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
            {seeMore}
          </button>
          
          {isExpanded && (
            <div 
              id={`${id}-details`}
              className="mt-4 p-6 bg-gray-50 rounded-xl border border-gray-200"
              role="region"
              aria-labelledby={`${id}-button`}
            >
              <p className="text-gray-700 leading-relaxed">{seeMoreDesc}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function PricingDetails() {
  const { t } = useI18n();

  const details = [
    {
      id: "custom",
      title: "Submission-Ready Business Plan (15–35 pages)",
      whoFor: "Who it's for",
      whoForDesc: "Submitting to aws/FFG/Wirtschaftsagentur/EU, banks/leasing, visas (RWR), or sharing with investors",
      youProvide: "You provide",
      youProvideDesc: "Model summary (offer, customer, pricing, channels), Basic numbers (price, volumes, costs, funding need), Target route (if known)",
      youGet: "You get",
      youGetDesc: "Full plan in standard order (Executive Summary → Financials), Financial tables: revenue model, cost breakdown, cash-flow, use of funds, Readiness Check — cross-check to route requirements; status: Aligned / Needs fix / Missing, Customization & formatting (DE/EN) + Executive One-Pager (DE/EN)",
      routeExtras: "Route extras (included when relevant)",
      routeExtrasDesc: "Budget / planning sheet, Work packages & timeline, Annex guidance (CVs, market evidence), Bank summary page (ratios & repayment), Investor teaser one-pager & basic cap table",
      outline: "Outline",
      outlineDesc: "Exec Summary · Problem/Solution · Market/Competition · Product/Operations · Team · GTM · Financials · Risks",
      export: "Export & language",
      exportDesc: "PDF/DOCX · DE/EN · 15–35 pages",
      cta: "Start Business Plan",
      ctaHref: "/editor?plan=custom",
      seeMore: "See more",
      seeMoreDesc: "What you must attach yourself: identity/company documents, legal/visa papers, signed forms, letters of intent."
    },
    {
      id: "review",
      title: "Update & Review (existing text)",
      whoFor: "Who it's for",
      whoForDesc: "You have a draft and need it aligned to grant/bank/visa/equity expectations",
      youProvide: "You provide",
      youProvideDesc: "Your text (paste per section), route (if known), latest numbers",
      youGet: "You get",
      youGetDesc: "Re-structure & completion to the expected outline (we add missing sections and financials), Readiness Check — cross-check to route requirements; status: Aligned / Needs fix / Missing, Customization & formatting (DE/EN) + Executive One-Pager (DE/EN) + PDF/DOCX export",
      routeExtras: "Route extras (included when relevant)",
      routeExtrasDesc: "Budget / planning sheet, Work packages & timeline, Annex guidance (CVs, market evidence), Bank summary page (ratios & repayment), Investor teaser one-pager & basic cap table",
      outline: "Outline",
      outlineDesc: "Exec Summary · Market/Competition · Product/Operations · Team · GTM · Financials · Risks",
      export: "Export & language",
      exportDesc: "PDF/DOCX · DE/EN · length depends on your material",
      cta: "Start Update & Review",
      ctaHref: "/editor?plan=review",
      seeMore: "See more",
      seeMoreDesc: "Optional reviewer memo (how the plan maps to criteria)."
    },
    {
      id: "strategy",
      title: "Strategy Document",
      whoFor: "Who it's for",
      whoForDesc: "Early ideas/pivots — decide who to serve, what to charge, and how to launch",
      youProvide: "You provide",
      youProvideDesc: "Idea & goals; any market notes (optional); rough numbers (optional)",
      youGet: "You get",
      youGetDesc: "Business Model Canvas snapshot (9 blocks) with concise assumptions, GTM plan: target market, pricing, promotion, distribution channels, sales tactics, Unit economics (simple): price, unit cost, contribution margin, break-even — clearly explained, Milestones & next steps + Executive One-Pager (DE/EN); content carries over automatically",
      routeExtras: null,
      routeExtrasDesc: null,
      outline: "Outline",
      outlineDesc: "BMC (9 blocks) · GTM (target/pricing/promotion/channels/sales) · Unit Economics · Milestones",
      export: "Export & language",
      exportDesc: "PDF/DOCX · DE/EN · 4–8 pages",
      cta: "Start Strategy",
      ctaHref: "/editor?plan=strategy",
      seeMore: "See more",
      seeMoreDesc: "Optional canvas snapshot export and assumptions log."
    }
  ];

  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('pricing.planDetails')}</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Detailed information about each plan to help you choose the right business planning solution for your needs.
          </p>
        </div>
        
        <div className="space-y-12">
          {details.map((detail, index) => (
            <div key={detail.id} className="relative">
              {/* Connection line for visual flow */}
              {index < details.length - 1 && (
                <div className="hidden lg:block absolute left-1/2 top-full w-0.5 h-12 bg-gradient-to-b from-blue-200 to-transparent transform -translate-x-1/2"></div>
              )}
              <PricingDetailCard {...detail} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
