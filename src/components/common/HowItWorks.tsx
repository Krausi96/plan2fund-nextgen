import { useI18n } from "@/contexts/I18nContext";

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
    <section className="py-12 md:py-16 bg-neutral-50">
      <div className="container">
        <div className="animate-fade-in-up text-center mb-16">
        <h2 className="text-4xl font-bold text-neutral-900 mb-4">
          {t('howItWorks.title')}
        </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const isHighlighted = isStepHighlighted(index);
            return (
            <div
              key={index}
              className="animate-fade-in-up-staggered h-full"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className={`relative p-6 rounded-xl transition-all duration-300 h-full flex flex-col ${
                isHighlighted 
                  ? 'bg-blue-50 border-2 border-blue-200 shadow-lg' 
                  : 'bg-white shadow-md hover:shadow-lg'
              }`}>
                {/* Step Number */}
                <div className={`w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-bold mb-4 ${
                  isHighlighted ? 'bg-blue-600' : 'bg-primary-600'
                }`}>
                  {index + 1}
                </div>
                
                
                {/* Icon */}
                <div className={`w-16 h-16 ${step.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                  isHighlighted ? 'ring-2 ring-blue-200' : ''
                }`}>
                  <span className="text-3xl">{step.icon}</span>
                </div>
                
                {/* Content */}
                <div className="flex-1 text-center">
                  <h3 className={`text-xl font-semibold mb-3 ${
                    isHighlighted ? 'text-blue-900' : 'text-neutral-900'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed text-left">
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
