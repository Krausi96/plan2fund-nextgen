import { motion } from "framer-motion";
import { useI18n } from "@/contexts/I18nContext";

interface WhyAustriaProps {
  targetGroup?: string;
}

export function WhyAustria({ targetGroup = 'default' }: WhyAustriaProps) {
  const { t } = useI18n();

  // Helper function to determine if a benefit should be highlighted
  const isBenefitHighlighted = (benefitIndex: number) => {
    if (targetGroup === 'default') return false;
    
    // Map target groups to benefit indices to highlight
    const highlightMap = {
      'startups': [0, 2],      // Emphasize innovation culture and supportive ecosystem
      'sme': [1, 2],           // Emphasize funding programs and supportive ecosystem
      'advisors': [2, 0],      // Emphasize supportive ecosystem and innovation culture
      'universities': [0, 1]   // Emphasize innovation culture and funding programs
    };
    
    return highlightMap[targetGroup as keyof typeof highlightMap]?.includes(benefitIndex) || false;
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
    <section className="py-12 md:py-16 bg-white">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4">
            {t('whyAustria.title')}
          </h2>
          <p className="text-base text-neutral-600 max-w-2xl mx-auto">
            {t('whyAustria.subtitle')}
          </p>
        </motion.div>


        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {benefits.map((benefit, index) => {
            const isHighlighted = isBenefitHighlighted(index);
            return (
            <div key={index} className={`p-6 rounded-xl transition-all duration-300 h-full flex flex-col ${
              isHighlighted 
                ? 'bg-blue-50 border-2 border-blue-200 shadow-lg' 
                : 'bg-white'
            }`}>
              {/* Highlighted Badge */}
              {isHighlighted && (
                <div className="mb-4">
                  <span className="text-xs bg-green-600 text-white px-3 py-1 rounded-full font-semibold shadow-sm">
                    Recommended
                  </span>
                </div>
              )}
              
              <div className={`w-16 h-16 ${benefit.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 ${
                isHighlighted ? 'ring-2 ring-blue-200' : ''
              }`}>
                <span className="text-3xl">{benefit.icon}</span>
              </div>
              
              <div className="flex-1 text-center">
                <h3 className={`text-xl font-semibold mb-3 min-h-[3rem] flex items-center justify-center ${
                  isHighlighted ? 'text-blue-900' : 'text-neutral-900'
                }`}>
                  {benefit.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed text-justify">
                  {benefit.description}
                </p>
              </div>
            </div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
