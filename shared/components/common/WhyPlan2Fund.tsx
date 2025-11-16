import { useI18n } from "@/shared/contexts/I18nContext";

interface WhyPlan2FundProps {
  targetGroup?: string;
}

export function WhyPlan2Fund({ targetGroup = 'default' }: WhyPlan2FundProps) {
  const { t } = useI18n();

  // Get target group specific content or fallback to default
  const getTranslationKey = (key: string) => {
    return targetGroup !== 'default' ? `whyPlan2Fund.${key}.${targetGroup}` : `whyPlan2Fund.${key}.default`;
  };

  const features = [
    {
      icon: "🔍", // Search icon for finding programs
      title: t(getTranslationKey('features.0.title') as any),
      description: t(getTranslationKey('features.0.description') as any),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: "⚡", // Lightning icon for efficiency/speed
      title: t(getTranslationKey('features.1.title') as any),
      description: t(getTranslationKey('features.1.description') as any),
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: "🛡️", // Shield icon for compliance/protection
      title: t(getTranslationKey('features.2.title') as any),
      description: t(getTranslationKey('features.2.description') as any),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: "📄", // Document icon for ready documents
      title: t(getTranslationKey('features.3.title') as any),
      description: t(getTranslationKey('features.3.description') as any),
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];
  return (
    <section 
      className="py-20 md:py-28 bg-white"
      aria-labelledby="why-plan2fund-heading"
    >
      <div className="container max-w-7xl">
        <div className="text-center mb-16">
        <h2
          id="why-plan2fund-heading"
          className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight"
        >
          {t(getTranslationKey('title') as any)}
        </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    {t(getTranslationKey('subtitle') as any)}
                  </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col p-8 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 h-full"
            >
              {/* Icon */}
              <div className={`w-14 h-14 ${feature.bgColor} rounded-lg flex items-center justify-center mb-6`}>
                <span className="text-2xl" aria-hidden="true">{feature.icon}</span>
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
