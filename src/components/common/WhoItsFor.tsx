import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

export function WhoItsFor() {
  const { t } = useI18n();

  const personas = [
    {
      title: t("whoItsFor.soloEntrepreneurs.title"),
      description: t("whoItsFor.soloEntrepreneurs.description"),
      features: [
        t("whoItsFor.soloEntrepreneurs.feature1"),
        t("whoItsFor.soloEntrepreneurs.feature2"),
        t("whoItsFor.soloEntrepreneurs.feature3")
      ],
      icon: "🚀",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
      isPrimary: true
    },
    {
      title: t("whoItsFor.sme.title"),
      description: t("whoItsFor.sme.description"),
      features: [
        t("whoItsFor.sme.feature1"),
        t("whoItsFor.sme.feature2"),
        t("whoItsFor.sme.feature3")
      ],
      icon: "✏️",
      color: "text-green-600",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100",
      isPrimary: false
    },
    {
      title: t("whoItsFor.advisors.title"),
      description: t("whoItsFor.advisors.description"),
      features: [
        t("whoItsFor.advisors.feature1"),
        t("whoItsFor.advisors.feature2"),
        t("whoItsFor.advisors.feature3")
      ],
      icon: "📋",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100",
      isPrimary: false
    },
    {
      title: t("whoItsFor.universities.title"),
      description: t("whoItsFor.universities.description"),
      features: [
        t("whoItsFor.universities.feature1"),
        t("whoItsFor.universities.feature2"),
        t("whoItsFor.universities.feature3")
      ],
      icon: "🎓",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      iconBg: "bg-indigo-100",
      isPrimary: false
    },
  ];
  return (
    <section className="section-padding bg-white" aria-labelledby="who-its-for-heading">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 id="who-its-for-heading" className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
            {t("whoItsFor.title")}
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            {t("whoItsFor.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {personas.map((persona, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className={`p-6 h-full flex flex-col relative group rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                persona.isPrimary 
                  ? "border-blue-200 bg-blue-50/50 hover:border-blue-300" 
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}>
                {/* Badge for Primary */}
                {persona.isPrimary && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-sm">
                      Primary
                    </span>
                  </div>
                )}
                
                {/* Header */}
                <div className="text-center mb-4">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300 ${persona.iconBg}`}>
                    <span className="text-2xl">{persona.icon}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                    {persona.title}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {persona.description}
                  </p>
                </div>

                {/* Features - 3 max */}
                <div className="flex-grow">
                  <ul className="space-y-2">
                    {persona.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-sm text-neutral-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Common CTA - Force redeploy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <a 
            href="/editor"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 hover:shadow-lg transform hover:scale-105"
            title="Get started with Plan2Fund"
            aria-label="Get started with Plan2Fund"
          >
            <span className="flex items-center justify-center">
              {t("whoItsFor.getStarted")}
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </a>
        </motion.div>

      </div>
    </section>
  );
}
