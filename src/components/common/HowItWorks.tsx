import { motion } from "framer-motion";
import { useI18n } from "@/contexts/I18nContext";

interface HowItWorksProps {
  targetGroup?: string;
}

export function HowItWorks({ targetGroup = 'default' }: HowItWorksProps) {
  const { t } = useI18n();

  // Helper function to determine if a step should be highlighted
  const isStepHighlighted = (stepIndex: number) => {
    if (targetGroup === 'default') return false;
    
    // Map target groups to step indices to highlight
    const highlightMap = {
      'startups': [0, 2],      // Emphasize idea description and business plan creation
      'sme': [1, 3],           // Emphasize program matching and ready documents
      'advisors': [2, 3],      // Emphasize business plan creation and multiple formats
      'universities': [0, 2]   // Emphasize research projects and academic writing
    };
    
    return highlightMap[targetGroup as keyof typeof highlightMap]?.includes(stepIndex) || false;
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
    <section className="section-padding bg-neutral-50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">
            {t('howItWorks.title')}
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const isHighlighted = isStepHighlighted(index);
            return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <div className={`relative p-6 rounded-xl transition-all duration-300 h-full flex flex-col ${
                isHighlighted 
                  ? 'bg-blue-50 border-2 border-blue-200 shadow-lg' 
                  : 'bg-white'
              }`}>
                {/* Step Number */}
                <div className={`w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-bold mb-4 ${
                  isHighlighted ? 'bg-blue-600' : 'bg-primary-600'
                }`}>
                  {index + 1}
                </div>
                
                {/* Highlighted Badge */}
                {isHighlighted && (
                  <div className="mb-4">
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-semibold shadow-sm">
                      Recommended
                    </span>
                  </div>
                )}
                
                {/* Icon */}
                <div className={`w-16 h-16 ${step.bgColor} rounded-2xl flex items-center justify-center mb-4 ${
                  isHighlighted ? 'ring-2 ring-blue-200' : ''
                }`}>
                  <span className="text-3xl">{step.icon}</span>
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-3 min-h-[3rem] flex items-center ${
                    isHighlighted ? 'text-blue-900' : 'text-neutral-900'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
