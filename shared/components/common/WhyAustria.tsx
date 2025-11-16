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
    <section className="py-20 md:py-28 bg-white">
      <div className="container max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            {t('whyAustria.title')}
          </h2>
          <p 
            className="text-xl text-gray-600 max-w-2xl mx-auto"
            dangerouslySetInnerHTML={{
              __html: t('whyAustria.subtitle').replace(/\*(.*?)\*/g, '<strong class="font-semibold">$1</strong>')
            }}
          />
        </div>


        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const isHighlighted = isBenefitHighlighted(index);
            return (
            <div key={index} className={`p-8 rounded-lg border transition-all duration-200 h-full flex flex-col ${
              isHighlighted 
                ? 'border-blue-200 bg-gradient-to-br from-blue-50/50 to-white' 
                : 'border-gray-200 bg-white hover:shadow-md'
            }`}>
              
              <div className={`w-14 h-14 ${benefit.bgColor} rounded-lg flex items-center justify-center mb-6`}>
                <span className="text-2xl">{benefit.icon}</span>
              </div>
              
              <div className="flex-1">
                <h3 className={`text-xl font-semibold mb-3 ${
                  isHighlighted ? 'text-gray-900' : 'text-gray-900'
                }`}>
                  {benefit.title}
                </h3>
                <p 
                  className="text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: benefit.description.replace(/\*(.*?)\*/g, '<strong class="font-semibold">$1</strong>')
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
