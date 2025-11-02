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
      className="py-12 md:py-16 bg-gradient-to-br from-primary-50 to-blue-50"
      aria-labelledby="why-plan2fund-heading"
    >
      <div className="container">
        <div className="animate-fade-in-up text-center mb-12 md:mb-16">
        <h2
          id="why-plan2fund-heading"
          className="text-4xl font-bold text-neutral-900 mb-4"
        >
          {t(getTranslationKey('title') as any)}
        </h2>
                  <p className="text-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed">
                    {t(getTranslationKey('subtitle') as any)}
                  </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="animate-fade-in-up-staggered flex flex-col gap-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 h-full"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className={`w-16 h-16 ${feature.bgColor} rounded-xl flex items-center justify-center mx-auto`}>
                <span className="text-2xl" aria-hidden="true">{feature.icon}</span>
              </div>
              
              {/* Content */}
              <div className="flex-1 text-center">
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 min-h-[3rem] flex items-center justify-center">
                  {feature.title}
                </h3>
                <p className="text-base text-neutral-600 leading-relaxed text-center">
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
