import { motion } from "framer-motion";
import { useI18n } from "@/contexts/I18nContext";

export function WhoItsFor() {
  const { t } = useI18n();

  const personas = [
    {
      title: t('whoItsFor.solo.title'),
      description: t('whoItsFor.solo.description'),
      features: [
        t('whoItsFor.solo.features.0'),
        t('whoItsFor.solo.features.1'),
        t('whoItsFor.solo.features.2')
      ],
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      emoji: "🚀",
      badge: t('whoItsFor.solo.badge'),
      href: "/reco?persona=solo",
      isPrimary: true
    },
    {
      title: t('whoItsFor.sme.title'),
      description: t('whoItsFor.sme.description'),
      features: [
        t('whoItsFor.sme.features.0'),
        t('whoItsFor.sme.features.1'),
        t('whoItsFor.sme.features.2')
      ],
      color: "text-green-600",
      bgColor: "bg-green-50",
      emoji: "🏢",
      href: "/reco?persona=sme",
      isPrimary: false
    },
    {
      title: t('whoItsFor.advisors.title'),
      description: t('whoItsFor.advisors.description'),
      features: [
        t('whoItsFor.advisors.features.0'),
        t('whoItsFor.advisors.features.1'),
        t('whoItsFor.advisors.features.2')
      ],
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      emoji: "🤝",
      href: "/about#partners",
      isPrimary: false
    },
  ];
  return (
    <section className="section-padding bg-white">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            {t('whoItsFor.title')}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {personas.map((persona, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className={`p-6 h-full flex flex-col relative group rounded-xl border-2 transition-all duration-300 ${
                persona.isPrimary 
                  ? "border-blue-200 bg-blue-50/50 hover:border-blue-300 hover:shadow-lg" 
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
              }`}>
                {/* Badge for Primary */}
                {persona.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                      {persona.badge}
                    </span>
                  </div>
                )}
                
                {/* Emoji */}
                <div className="text-3xl mb-3 group-hover:scale-105 transition-transform duration-300">{persona.emoji}</div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                  {persona.title}
                </h3>
                <p className="text-neutral-600 mb-4 leading-relaxed flex-grow group-hover:text-neutral-700 transition-colors duration-300">
                  {persona.description}
                </p>
                
                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {persona.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-neutral-600">
                      <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {/* CTA */}
                <a 
                  href={persona.href}
                  className={`w-full px-4 py-2 ${persona.bgColor} ${persona.color} rounded-lg font-semibold text-center hover:opacity-80 transition-opacity group-hover:scale-105 transform transition-transform`}
                  title={`Learn more about ${persona.title.toLowerCase()}`}
                >
                  {persona.title.includes("Advisors") ? t("whoItsFor.forPartners") : t("whoItsFor.seeMatches")} →
                </a>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
