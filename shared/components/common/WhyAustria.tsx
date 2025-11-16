import { useI18n } from "@/shared/contexts/I18nContext";

interface WhyAustriaProps {
  targetGroup?: string;
}

export function WhyAustria({}: WhyAustriaProps) {
  const { t } = useI18n();

  // Helper function to determine if a benefit should be highlighted
  const isBenefitHighlighted = (_benefitIndex: number) => {
    // Disabled highlighting for all target groups
    return false;
  };

  const benefits = [
    {
      icon: "🏢", // Building icon for innovation culture
      title: t('whyAustria.benefits.innovation.title'),
      description: t('whyAustria.benefits.innovation.description'),
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: "💰", // Money icon for funding programs
      title: t('whyAustria.benefits.funding.title'),
      description: t('whyAustria.benefits.funding.description'),
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: "🤝", // Handshake icon for supportive ecosystem
      title: t('whyAustria.benefits.support.title'),
      description: t('whyAustria.benefits.support.description'),
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="container max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 tracking-tight">
            {t('whyAustria.title')}
          </h2>
          <p 
            className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: t('whyAustria.subtitle').replace(/\*(.*?)\*/g, '<strong class="text-neutral-900 font-semibold">$1</strong>')
            }}
          />
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const isHighlighted = isBenefitHighlighted(index);
            return (
              <div 
                key={index} 
                className={`group p-8 rounded-2xl transition-all duration-300 h-full flex flex-col border-2 ${
                  isHighlighted 
                    ? 'bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-xl' 
                    : 'bg-white border-neutral-200 shadow-md hover:shadow-xl hover:border-blue-200'
                } hover:-translate-y-1`}
              >
                <div className={`w-20 h-20 ${benefit.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md group-hover:scale-110 transition-transform duration-300 ${
                  isHighlighted ? 'ring-4 ring-blue-200' : ''
                }`}>
                  <span className="text-3xl">{benefit.icon}</span>
                </div>
                
                <div className="flex-1 text-center">
                  <h3 className={`text-2xl font-bold mb-4 ${
                    isHighlighted ? 'text-blue-900' : 'text-neutral-900'
                  }`}>
                    {benefit.title}
                  </h3>
                  <p 
                    className="text-base text-neutral-600 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: benefit.description.replace(/\*(.*?)\*/g, '<strong class="text-neutral-900 font-semibold">$1</strong>')
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
