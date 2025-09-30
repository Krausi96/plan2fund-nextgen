import { motion } from "framer-motion";
import { Search, Zap, Shield, Award } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

interface WhyPlan2FundProps {
  targetGroup?: string;
}

export function WhyPlan2Fund({ targetGroup = 'default' }: WhyPlan2FundProps) {
  const { t } = useI18n();

  // Debug logging
  console.debug('WhyPlan2Fund targetGroup:', targetGroup);

  // Get target group specific content or fallback to default
  const getTranslationKey = (key: string) => {
    const translationKey = targetGroup !== 'default' ? `whyPlan2Fund.${key}.${targetGroup}` : `whyPlan2Fund.${key}.default`;
    console.debug(`Translation key for ${key}:`, translationKey);
    return translationKey;
  };

  const features = [
    {
      icon: Search,
      title: t(getTranslationKey('features.0.title') as any),
      description: t(getTranslationKey('features.0.description') as any),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Zap,
      title: t(getTranslationKey('features.1.title') as any),
      description: t(getTranslationKey('features.1.description') as any),
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Shield,
      title: t(getTranslationKey('features.2.title') as any),
      description: t(getTranslationKey('features.2.description') as any),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Award,
      title: t(getTranslationKey('features.3.title') as any),
      description: t(getTranslationKey('features.3.description') as any),
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];
  return (
    <section 
      className="section-padding bg-gradient-to-br from-primary-50 to-blue-50"
      aria-labelledby="why-plan2fund-heading"
    >
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
                  <h2 
                    id="why-plan2fund-heading"
                    className="text-2xl md:text-3xl lg:text-4xl font-bold text-neutral-900 mb-4"
                  >
                    {t(getTranslationKey('title') as any)}
                  </h2>
                  <p className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
                    {t(getTranslationKey('subtitle') as any)}
                  </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Icon */}
              <div className={`w-12 h-12 sm:w-14 sm:h-14 ${feature.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0`}>
                <feature.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${feature.color}`} aria-hidden="true" />
              </div>
              
              {/* Content */}
              <div className="text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
