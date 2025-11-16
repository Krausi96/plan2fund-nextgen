import { useI18n } from "@/shared/contexts/I18nContext";

interface HowItWorksProps {
  targetGroup?: string;
}

export function HowItWorks({}: HowItWorksProps) {
  const { t } = useI18n();

  // Helper function to determine if a step should be highlighted
  const isStepHighlighted = (_stepIndex: number) => {
    // Disabled highlighting for all target groups
    return false;
  };

  const steps = [
    {
      icon: "🔍", // Search icon for idea description
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: "📋", // Document icon for finding programs
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: "✏️", // Edit icon for creating business plan
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: "📤", // Upload icon for downloading and using
      title: t('howItWorks.step4.title'),
      description: t('howItWorks.step4.description'),
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-white via-blue-50/20 to-white">
      <div className="container max-w-7xl">
        <div className="text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
          {t('howItWorks.title')}
        </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const isHighlighted = isStepHighlighted(index);
            return (
            <div
              key={index}
              className="h-full"
            >
              <div className={`relative p-8 rounded-lg border transition-all duration-200 h-full flex flex-col ${
                isHighlighted 
                  ? 'border-blue-200 bg-gradient-to-br from-blue-50/50 to-white' 
                  : 'border-gray-200 bg-white hover:shadow-md'
              }`}>
                {/* Step Number */}
                <div className={`w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-semibold mb-6 ${
                  isHighlighted ? 'bg-blue-600' : 'bg-blue-600'
                }`}>
                  {index + 1}
                </div>
                
                
                {/* Icon */}
                <div className={`w-14 h-14 ${step.bgColor} rounded-lg flex items-center justify-center mb-6`}>
                  <span className="text-2xl">{step.icon}</span>
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-3 ${
                    isHighlighted ? 'text-gray-900' : 'text-gray-900'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
