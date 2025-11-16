import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import CTAStrip from '@/shared/components/common/CTAStrip';
import SEOHead from '@/shared/components/common/SEOHead';
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
      
      <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white py-20 md:py-28">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 tracking-tight">
                {t("pricing.title")}
              </h1>
              <p className="text-xl md:text-2xl text-neutral-600 leading-relaxed">
                {t("pricing.subtitle")}
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 md:py-28">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {planTypes.map((plan) => {
                const pricing = calculatePricing(plan.product, selectedRoute, addonPack);
                
                return (
                  <div
                    key={plan.id}
                    id={plan.id}
                    className="group bg-white rounded-2xl shadow-lg border-2 border-neutral-200 p-8 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-2"
                  >
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="text-5xl mb-6">{plan.icon}</div>
                      <h3 className="text-3xl font-bold text-neutral-900 mb-3">
                        {plan.title}
                      </h3>
                      <p className="text-neutral-600 text-base mb-6 leading-relaxed">
                        {plan.subtitle}
                      </p>
                      
                      {/* Price */}
                      <div className="mb-6">
                        <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
                          {pricing.basePrice === 0 ? 'Free' : `€${pricing.basePrice}`}
                        </div>
                        {pricing.basePrice > 0 && (
                          <p className="text-sm text-neutral-500 mt-1">
                            {t("pricing.labels.inclVat")}
                          </p>
                        )}
                        <p className="text-sm text-neutral-600 mt-2 font-medium">
                          {pricing.deliveryTime}
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-8">
                      <h4 className="font-bold text-neutral-900 mb-4 text-lg">
                        {t("pricing.labels.whatYouGet")}
                      </h4>
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start text-sm text-neutral-700">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {/* Additional includes from pricing engine */}
                      <div className="mt-6 pt-6 border-t border-neutral-200">
                        <ul className="space-y-2">
                          {pricing.includes.map((item, idx) => (
                            <li key={idx} className="text-xs text-neutral-600 flex items-start">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                              <span className="leading-relaxed">{item}</span>
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
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                        {plan.product === 'strategy' && t("pricing.buttons.startStrategy")}
                        {plan.product === 'review' && t("pricing.buttons.startReview")}
                        {plan.product === 'submission' && t("pricing.buttons.startSubmission")}
                        <ArrowRight className="ml-2 w-5 h-5" />
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

