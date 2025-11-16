import { useI18n } from "@/shared/contexts/I18nContext";

interface PlanTypesProps {
  targetGroup?: string;
}

export function PlanTypes({ targetGroup = 'default' }: PlanTypesProps) {
  const { t } = useI18n();
  
  // Helper function to determine if a plan type should be highlighted
  const isPlanHighlighted = (planId: string) => {
    if (targetGroup === 'default') return false;
    
    // Map target groups to plan types
    const highlightMap = {
      'startups': 'strategy',    // Strategy Document for first-time entrepreneurs
      'sme': 'review',          // Upgrade & Review for existing businesses
      'advisors': 'custom',     // Custom Business Plan for client work
      'universities': 'strategy' // Strategy Document for research projects
    };
    
    return highlightMap[targetGroup as keyof typeof highlightMap] === planId;
  };

  const planTypes = [
    {
      id: "strategy",
      title: t("planTypes.strategy.title"),
      icon: "💡", // Lightbulb for strategy/ideas
      subtitle: t("planTypes.strategy.subtitle"),
      features: [
        t("planTypes.strategy.feature1"),
        t("planTypes.strategy.feature2"),
        t("planTypes.strategy.feature3"),
        t("planTypes.strategy.feature4")
      ],
      href: "/pricing#strategy",
      hasRouteExtras: false
    },
    {
      id: "review",
      title: t("planTypes.review.title"),
      icon: "✏️", // Edit pencil for review/update
      subtitle: t("planTypes.review.subtitle"),
      features: [
        t("planTypes.review.feature1"),
        t("planTypes.review.feature2"),
        t("planTypes.review.feature3"),
        t("planTypes.review.feature4")
      ],
      href: "/pricing#review",
      hasRouteExtras: false
    },
    {
      id: "custom",
      title: t("planTypes.custom.title"),
      icon: "📋", // Clipboard for submission-ready documents
      subtitle: t("planTypes.custom.subtitle"),
      features: [
        t("planTypes.custom.feature1"),
        t("planTypes.custom.feature2"),
        t("planTypes.custom.feature3"),
        t("planTypes.custom.feature4")
      ],
      href: "/pricing#custom",
      hasRouteExtras: false
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-white via-blue-50/20 to-white">
      <div className="container max-w-7xl">
        <div className="text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
          {t("planTypes.title")}
        </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t("planTypes.subtitle")}
          </p>
        </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {planTypes.map((plan) => {
                    const isHighlighted = isPlanHighlighted(plan.id);
                    return (
                    <a
                      key={plan.id}
                      href={plan.href}
                      className={`block rounded-lg p-8 border bg-white transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:shadow-md ${
                        isHighlighted 
                          ? 'border-blue-200 bg-gradient-to-br from-blue-50/50 to-white hover:border-blue-300' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      aria-label={`Learn more about ${plan.title}`}
                    >
              {/* Header with icon and title */}
              <div className="mb-6">
                <div className="mb-6 text-center">
                  <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">{plan.icon}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {plan.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {plan.subtitle}
                </p>
              </div>

              {/* Key features */}
              <div className="mb-6 flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-4">{t("planTypes.keyFeatures")}</h4>
                <ul className="space-y-2.5">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="text-sm text-gray-600 flex items-start">
                      <svg className="w-4 h-4 text-blue-600 mr-2.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Additional documents note */}
              <div className="mt-auto pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  <span className="font-medium text-gray-700">{t("planTypes.additionalDocs")}</span> {t("planTypes.additionalDocsNote")}
                </p>
              </div>

                    </a>
                    );
                  })}
                </div>
      </div>
    </section>
  );
}
