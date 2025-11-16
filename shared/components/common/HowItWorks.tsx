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
    <section className="py-20 md:py-28 bg-gradient-to-b from-neutral-50 to-white">
      <div className="container max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 tracking-tight">
            {t('howItWorks.title')}
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const isHighlighted = isStepHighlighted(index);
            return (
              <div
                key={index}
                className="group relative"
              >
                <div className={`relative p-8 rounded-2xl transition-all duration-300 h-full flex flex-col border-2 ${
                  isHighlighted 
                    ? 'bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-xl' 
                    : 'bg-white border-neutral-200 shadow-md hover:shadow-xl hover:border-blue-200'
                } hover:-translate-y-1`}>
                  {/* Step Number */}
                  <div className={`absolute -top-4 -left-4 w-12 h-12 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg ${
                    isHighlighted ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-600 to-blue-700'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-20 h-20 ${step.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md group-hover:scale-110 transition-transform duration-300 ${
                    isHighlighted ? 'ring-4 ring-blue-200' : ''
                  }`}>
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 text-center">
                    <h3 className={`text-2xl font-bold mb-4 ${
                      isHighlighted ? 'text-blue-900' : 'text-neutral-900'
                    }`}>
                      {step.title}
                    </h3>
                    <p className="text-base text-neutral-600 leading-relaxed">
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
