import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";
import { ChevronDown, ChevronUp } from "lucide-react";

interface PricingDetailProps {
  id: string;
  title: string;
  whoFor: string;
  whoForDesc: string;
  youProvide: string;
  youProvideDesc: string;
  youGet: string;
  youGetDesc: string;
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

  return (
    <div id={id} className="scroll-mt-20">
      <h3 className="text-2xl font-bold text-gray-900 mb-8">{title}</h3>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">{whoFor}</h4>
            <p className="text-gray-700">{whoForDesc}</p>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">{youProvide}</h4>
            <p className="text-gray-700">{youProvideDesc}</p>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">{youGet}</h4>
            <p className="text-gray-700">{youGetDesc}</p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">{outline}</h4>
            <p className="text-gray-700">{outlineDesc}</p>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">{exportLabel}</h4>
            <p className="text-gray-700">{exportDesc}</p>
          </div>

          <div className="border-t pt-4">
            <Link href={ctaHref} className="inline-block">
              <Button>{cta}</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Expandable Section */}
      <div className="mt-8">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }
          }}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          aria-expanded={isExpanded}
          aria-controls={`${id}-details`}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
          {seeMore}
        </button>
        
        {isExpanded && (
          <div 
            id={`${id}-details`}
            className="mt-4 p-4 bg-gray-50 rounded-lg"
            role="region"
            aria-labelledby={`${id}-button`}
          >
            <p className="text-gray-700 text-sm">{seeMoreDesc}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PricingDetails() {
  const { t } = useI18n();

  const details = [
    {
      id: "custom",
      title: t('pricing.details.custom.title'),
      whoFor: t('pricing.details.custom.whoFor'),
      whoForDesc: t('pricing.details.custom.whoForDesc'),
      youProvide: t('pricing.details.custom.youProvide'),
      youProvideDesc: t('pricing.details.custom.youProvideDesc'),
      youGet: t('pricing.details.custom.youGet'),
      youGetDesc: t('pricing.details.custom.youGetDesc'),
      outline: t('pricing.details.custom.outline'),
      outlineDesc: t('pricing.details.custom.outlineDesc'),
      export: t('pricing.details.custom.export'),
      exportDesc: t('pricing.details.custom.exportDesc'),
      cta: t('pricing.details.custom.cta'),
      ctaHref: "/editor?plan=custom",
      seeMore: t('pricing.details.custom.seeMore'),
      seeMoreDesc: t('pricing.details.custom.seeMoreDesc')
    },
    {
      id: "review",
      title: t('pricing.details.review.title'),
      whoFor: t('pricing.details.review.whoFor'),
      whoForDesc: t('pricing.details.review.whoForDesc'),
      youProvide: t('pricing.details.review.youProvide'),
      youProvideDesc: t('pricing.details.review.youProvideDesc'),
      youGet: t('pricing.details.review.youGet'),
      youGetDesc: t('pricing.details.review.youGetDesc'),
      outline: t('pricing.details.review.outline'),
      outlineDesc: t('pricing.details.review.outlineDesc'),
      export: t('pricing.details.review.export'),
      exportDesc: t('pricing.details.review.exportDesc'),
      cta: t('pricing.details.review.cta'),
      ctaHref: "/editor?plan=review",
      seeMore: t('pricing.details.review.seeMore'),
      seeMoreDesc: t('pricing.details.review.seeMoreDesc')
    },
    {
      id: "strategy",
      title: t('pricing.details.strategy.title'),
      whoFor: t('pricing.details.strategy.whoFor'),
      whoForDesc: t('pricing.details.strategy.whoForDesc'),
      youProvide: t('pricing.details.strategy.youProvide'),
      youProvideDesc: t('pricing.details.strategy.youProvideDesc'),
      youGet: t('pricing.details.strategy.youGet'),
      youGetDesc: t('pricing.details.strategy.youGetDesc'),
      outline: t('pricing.details.strategy.outline'),
      outlineDesc: t('pricing.details.strategy.outlineDesc'),
      export: t('pricing.details.strategy.export'),
      exportDesc: t('pricing.details.strategy.exportDesc'),
      cta: t('pricing.details.strategy.cta'),
      ctaHref: "/editor?plan=strategy",
      seeMore: t('pricing.details.strategy.seeMore'),
      seeMoreDesc: t('pricing.details.strategy.seeMoreDesc')
    }
  ];

  return (
    <section className="max-w-6xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pricing.planDetails')}</h2>
      </div>
      
      <div className="space-y-16">
        {details.map((detail) => (
          <PricingDetailCard key={detail.id} {...detail} />
        ))}
      </div>
    </section>
  );
}
