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
    <section className="py-20 md:py-28 bg-white">
      <div className="container max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 tracking-tight">
            {t("planTypes.title")}
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            {t("planTypes.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {planTypes.map((plan) => {
            const isHighlighted = isPlanHighlighted(plan.id);
            return (
              <a
                key={plan.id}
                href={plan.href}
                className={`group block h-full rounded-2xl p-8 border-2 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/20 hover:shadow-2xl hover:-translate-y-2 ${
                  isHighlighted 
                    ? 'bg-gradient-to-br from-blue-50 via-white to-white border-blue-300 shadow-lg' 
                    : 'bg-white border-neutral-200 hover:border-blue-300 hover:shadow-xl'
                }`}
                aria-label={`Learn more about ${plan.title}`}
              >
                {/* Header with icon and title */}
                <div className="mb-6">
                  <div className="mb-6 text-center">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md transition-all duration-300 ${
                      isHighlighted 
                        ? 'bg-gradient-to-br from-blue-100 to-blue-50 group-hover:scale-110' 
                        : 'bg-gradient-to-br from-neutral-100 to-neutral-50 group-hover:bg-blue-50 group-hover:scale-110'
                    }`}>
                      <span className="text-3xl">{plan.icon}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-neutral-900 group-hover:text-blue-600 transition-colors mb-3">
                      {plan.title}
                    </h3>
                  </div>
                  <p className="text-base text-neutral-600 leading-relaxed text-center">
                    {plan.subtitle}
                  </p>
                </div>

                {/* Key features */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-neutral-900 mb-4 uppercase tracking-wide">{t("planTypes.keyFeatures")}</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="text-sm text-neutral-700 flex items-start">
                        <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Additional documents note */}
                <div className="mt-8 pt-6 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500 text-center">
                    <span className="font-semibold text-neutral-700">{t("planTypes.additionalDocs")}</span> {t("planTypes.additionalDocsNote")}
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
