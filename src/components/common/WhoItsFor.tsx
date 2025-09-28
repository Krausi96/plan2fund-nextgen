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
        t('whoItsFor.solo.features.2'),
        t('whoItsFor.solo.features.3')
      ],
      ideal: t('whoItsFor.solo.ideal'),
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
        t('whoItsFor.sme.features.2'),
        t('whoItsFor.sme.features.3')
      ],
      ideal: t('whoItsFor.sme.ideal'),
      color: "text-green-600",
      bgColor: "bg-green-50",
      emoji: "✏️",
      href: "/reco?persona=sme",
      isPrimary: false
    },
    {
      title: t('whoItsFor.advisors.title'),
      description: t('whoItsFor.advisors.description'),
      features: [
        t('whoItsFor.advisors.features.0'),
        t('whoItsFor.advisors.features.1'),
        t('whoItsFor.advisors.features.2'),
        t('whoItsFor.advisors.features.3')
      ],
      ideal: t('whoItsFor.advisors.ideal'),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      emoji: "📋",
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {personas.map((persona, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className={`p-8 h-full flex flex-col relative group rounded-2xl border-2 transition-all duration-300 ${
                persona.isPrimary 
                  ? "border-blue-200 bg-blue-50/50 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1" 
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg hover:-translate-y-1"
              }`}>
                {/* Badge for Primary */}
                {persona.badge && (
                  <div className="absolute top-6 right-6">
                    <span className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-sm">
                      {persona.badge}
                    </span>
                  </div>
                )}
                
                {/* Icon and Title Section */}
                <div className="text-center mb-6">
                  <div 
                    className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${persona.color.includes('blue') ? '#3B82F6' : persona.color.includes('green') ? '#10B981' : '#8B5CF6'}, ${persona.color.includes('blue') ? '#06B6D4' : persona.color.includes('green') ? '#059669' : '#A855F7'})`
                    }}
                  >
                    {persona.emoji}
                  </div>
                  
                  <h3 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                    {persona.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {persona.description}
                  </p>
                </div>
                
                {/* Features - simplified */}
                <div className="flex-grow mb-6">
                  <ul className="space-y-3">
                    {persona.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-sm text-neutral-600">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Ideal text for all personas */}
                  {persona.ideal && (
                    <div className={`mt-4 p-3 rounded-lg border-l-4 ${
                      persona.isPrimary 
                        ? 'bg-blue-50 border-blue-400' 
                        : persona.color.includes('green') 
                          ? 'bg-green-50 border-green-400' 
                          : 'bg-purple-50 border-purple-400'
                    }`}>
                      <p className={`text-sm font-medium ${
                        persona.isPrimary 
                          ? 'text-blue-800' 
                          : persona.color.includes('green') 
                            ? 'text-green-800' 
                            : 'text-purple-800'
                      }`}>
                        {persona.ideal}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* CTA */}
                <a 
                  href={persona.href}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-center hover:bg-blue-700 transition-all duration-300 group-hover:shadow-lg transform group-hover:scale-105"
                  title={`Learn more about ${persona.title.toLowerCase()}`}
                >
                  <span className="flex items-center justify-center">
                    {persona.title.includes("Advisors") ? t("whoItsFor.forPartners") : t("whoItsFor.seeMatches")}
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </a>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
