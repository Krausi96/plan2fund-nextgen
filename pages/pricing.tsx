import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import CTAStrip from '@/shared/components/common/CTAStrip';
import SEOHead from '@/shared/components/common/SEOHead';
import HeroLite from '@/shared/components/common/HeroLite';
import { useI18n } from "@/shared/contexts/I18nContext";
import analytics from "@/shared/user/analytics";
import { useEffect } from "react";
import { 
  ArrowRight, 
  CheckCircle
} from "lucide-react";
import { calculatePricing } from "@/features/export/engine/pricing";

export default function Pricing() {
  const { t } = useI18n();
  const selectedRoute = 'grant' as const; // Default route, no selector needed
  const addonPack = false; // No add-on pack option

  useEffect(() => {
    analytics.trackPageView('/pricing', 'Pricing');
  }, []);

  const planTypes = [
    {
      id: "strategy",
      title: t("planTypes.strategy.title"),
      icon: "💡",
      subtitle: t("planTypes.strategy.subtitle"),
      features: [
        t("planTypes.strategy.feature1"),
        t("planTypes.strategy.feature2"),
        t("planTypes.strategy.feature3"),
        t("planTypes.strategy.feature4")
      ],
      product: 'strategy' as const
    },
    {
      id: "review",
      title: t("planTypes.review.title"),
      icon: "✏️",
      subtitle: t("planTypes.review.subtitle"),
      features: [
        t("planTypes.review.feature1"),
        t("planTypes.review.feature2"),
        t("planTypes.review.feature3"),
        t("planTypes.review.feature4")
      ],
      product: 'review' as const
    },
    {
      id: "submission",
      title: t("planTypes.custom.title"),
      icon: "📋",
      subtitle: t("planTypes.custom.subtitle"),
      features: [
        t("planTypes.custom.feature1"),
        t("planTypes.custom.feature2"),
        t("planTypes.custom.feature3"),
        t("planTypes.custom.feature4")
      ],
      product: 'submission' as const
    }
  ];


  return (
    <>
      <SEOHead 
        pageKey="pricing"
        title={t("pricing.title")}
        description={t("pricing.subtitle")}
        keywords={t("pricing.keywords")}
      />
      
      <div className="min-h-screen bg-gray-50">
        <HeroLite
          title={t("pricing.title")}
          subtitle={t("pricing.subtitle")}
        />

        {/* Pricing Cards */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {planTypes.map((plan) => {
                const pricing = calculatePricing(plan.product, selectedRoute, addonPack);
                
                return (
                  <div
                    key={plan.id}
                    id={plan.id}
                    className="bg-white rounded-2xl shadow-sm border-2 border-neutral-200 p-8 hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    {/* Header */}
                    <div className="text-center mb-6">
                      <div className="text-4xl mb-4">{plan.icon}</div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {plan.subtitle}
                      </p>
                      
                      {/* Price */}
                      <div className="mb-4">
                        <div className="text-4xl font-bold text-blue-600">
                          {pricing.basePrice === 0 ? 'Free' : `€${pricing.basePrice}`}
                        </div>
                        {pricing.basePrice > 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            {t("pricing.labels.inclVat")}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          {pricing.deliveryTime}
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {t("pricing.labels.whatYouGet")}
                      </h4>
                      <ul className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start text-sm text-gray-600">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {/* Additional includes from pricing engine */}
                      <div className="mt-4 pt-4 border-t">
                        <ul className="space-y-1">
                          {pricing.includes.map((item, idx) => (
                            <li key={idx} className="text-xs text-gray-500 flex items-start">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Link
                      href={`/editor?product=${plan.product}&route=${selectedRoute}`}
                      onClick={() => analytics.trackUserAction('pricing_select_plan', { 
                        product: plan.product, 
                        route: selectedRoute 
                      })}
                    >
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        {plan.product === 'strategy' && t("pricing.buttons.startStrategy")}
                        {plan.product === 'review' && t("pricing.buttons.startReview")}
                        {plan.product === 'submission' && t("pricing.buttons.startSubmission")}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <CTAStrip 
          title="Ready to get started?"
          primaryAction={{ label: "Start your plan", href: "/editor" }}
        />
      </div>
    </>
  );
}

