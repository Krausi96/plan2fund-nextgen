import { motion } from "framer-motion";
import { Target, Search, FileCheck } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

export function WhyPlan2Fund() {
  const { t } = useI18n();

  const features = [
    {
      icon: Target,
      title: t('whyPlan2Fund.features.0.title'),
      description: t('whyPlan2Fund.features.0.description'),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Search,
      title: t('whyPlan2Fund.features.1.title'),
      description: t('whyPlan2Fund.features.1.description'),
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: FileCheck,
      title: t('whyPlan2Fund.features.2.title'),
      description: t('whyPlan2Fund.features.2.description'),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];
  return (
    <section className="section-padding bg-gradient-to-br from-primary-50 to-blue-50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">
            {t('whyPlan2Fund.title')}
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            {t('whyPlan2Fund.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              {/* Icon */}
              <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              
              {/* Content */}
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed">
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
