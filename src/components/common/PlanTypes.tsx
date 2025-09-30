import { motion } from "framer-motion";
import { useI18n } from "@/contexts/I18nContext";

interface PlanTypesProps {
  targetGroup?: string;
}

export function PlanTypes({ targetGroup = 'default' }: PlanTypesProps) {
  const { t } = useI18n();
  
  // Future: Use targetGroup to customize content for different personas
  // For now, we use the same content for all target groups
  console.debug('Target group for PlanTypes:', targetGroup);

  const planTypes = [
    {
      id: "strategy",
      title: t("planTypes.strategy.title"),
      icon: "💡", // Lightbulb for strategy/ideas
      subtitle: t("planTypes.strategy.subtitle"),
      features: [
        t("planTypes.strategy.feature1"),
        t("planTypes.strategy.feature2"),
        t("planTypes.strategy.feature3"),
        t("planTypes.strategy.feature4")
      ],
      href: "/pricing#strategy",
      hasRouteExtras: false
    },
    {
      id: "review",
      title: t("planTypes.review.title"),
      icon: "✏️", // Edit pencil for review/update
      subtitle: t("planTypes.review.subtitle"),
      features: [
        t("planTypes.review.feature1"),
        t("planTypes.review.feature2"),
        t("planTypes.review.feature3"),
        t("planTypes.review.feature4")
      ],
      href: "/pricing#review",
      hasRouteExtras: false
    },
    {
      id: "custom",
      title: t("planTypes.custom.title"),
      icon: "📋", // Clipboard for submission-ready documents
      subtitle: t("planTypes.custom.subtitle"),
      features: [
        t("planTypes.custom.feature1"),
        t("planTypes.custom.feature2"),
        t("planTypes.custom.feature3"),
        t("planTypes.custom.feature4"),
        t("planTypes.custom.feature5")
      ],
      href: "/pricing#custom",
      hasRouteExtras: false
    }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            {t("planTypes.title")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {planTypes.map((plan, index) => (
            <motion.a
              key={plan.id}
              href={plan.href}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="block bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-300 hover:-translate-y-2 transition-all duration-300 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`Learn more about ${plan.title}`}
            >
              {/* Header with icon and title */}
              <div className="mb-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                    <span className="text-2xl">{plan.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 group-hover:text-blue-600 transition-colors mb-2">
                    {plan.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed text-center">
                  {plan.subtitle}
                </p>
              </div>

              {/* Key features */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">{t("planTypes.keyFeatures")}</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="text-sm text-gray-600 flex items-start">
                      <svg className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Additional documents note */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                  <span className="font-medium">{t("planTypes.additionalDocs")}</span> {t("planTypes.additionalDocsNote")}
                </p>
              </div>

              {/* CTA */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{t("planTypes.learnMore")}</span>
                  <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.a>
          ))}
        </div>


      </div>
    </section>
  );
}
