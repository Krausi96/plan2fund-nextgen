import { motion } from "framer-motion";
import { useI18n } from "@/contexts/I18nContext";

export function PlanTypes() {
  const { t } = useI18n();

  const planTypes = [
    {
      id: "strategy",
      title: t('planTypes.strategy.title'),
      subtitle: t('planTypes.strategy.subtitle'),
      description: t('planTypes.strategy.description'),
      features: [
        t('planTypes.strategy.features.0'),
        t('planTypes.strategy.features.1'),
        t('planTypes.strategy.features.2')
      ],
      badges: [
        t('planTypes.strategy.badges.0'),
        t('planTypes.strategy.badges.1'),
        t('planTypes.strategy.badges.2')
      ],
      helper: t('planTypes.strategy.helper')
    },
    {
      id: "review",
      title: t('planTypes.review.title'),
      subtitle: t('planTypes.review.subtitle'),
      description: t('planTypes.review.description'),
      features: [
        t('planTypes.review.features.0'),
        t('planTypes.review.features.1'),
        t('planTypes.review.features.2')
      ],
      badges: [
        t('planTypes.review.badges.0'),
        t('planTypes.review.badges.1'),
        t('planTypes.review.badges.2')
      ],
      helper: t('planTypes.review.helper')
    },
    {
      id: "custom",
      title: t('planTypes.custom.title'),
      subtitle: t('planTypes.custom.subtitle'),
      description: t('planTypes.custom.description'),
      features: [
        t('planTypes.custom.features.0'),
        t('planTypes.custom.features.1'),
        t('planTypes.custom.features.2')
      ],
      badges: [
        t('planTypes.custom.badges.0'),
        t('planTypes.custom.badges.1'),
        t('planTypes.custom.badges.2')
      ],
      helper: t('planTypes.custom.helper')
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
            Choose your plan
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {planTypes.map((plan, index) => (
            <motion.a
              key={plan.id}
              href={`/pricing#${plan.id}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="block bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {plan.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: plan.description }}></p>
              </div>

              <div className="mb-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-2 mt-0.5">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {plan.badges.map((badge, badgeIndex) => (
                  <span key={badgeIndex} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {badge}
                  </span>
                ))}
              </div>

              {/* Helper text */}
              <p className="text-xs text-gray-500">{plan.helper}</p>
            </motion.a>
          ))}
        </div>

        {/* Add-on Pack mention */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-6"
        >
          <p className="text-sm text-gray-500">
            Optional <strong>Add-on Pack</strong>: Rush + extra revision + provider form help → <a href="/pricing#addons" className="text-blue-600 hover:text-blue-800 underline">/pricing#addons</a>
          </p>
        </motion.div>

      </div>
    </section>
  );
}
