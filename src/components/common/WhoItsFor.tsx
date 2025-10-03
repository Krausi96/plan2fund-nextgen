import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

interface WhoItsForProps {
  targetGroup?: string;
}

export function WhoItsFor({ targetGroup = 'default' }: WhoItsForProps) {
  const { t } = useI18n();
  
  // Helper function to determine if a persona should be highlighted
  const isPersonaHighlighted = (personaIndex: number) => {
    if (targetGroup === 'default') return false;
    
    // Map target groups to persona indices
    const highlightMap = {
      'startups': 0, // Solo-Entrepreneurs & Startups
      'sme': 1,     // SMEs & Growing Businesses  
      'advisors': 2, // Business Advisors
      'universities': 3 // Universities & Accelerators
    };
    
    return highlightMap[targetGroup as keyof typeof highlightMap] === personaIndex;
  };

  // Helper function to determine if a persona should be primary (only for default/landing page)
  const isPersonaPrimary = (personaIndex: number) => {
    // Only show primary on default/landing page, and only for the first persona
    return targetGroup === 'default' && personaIndex === 0;
  };

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
      iconBg: "bg-blue-100"
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
    <section className="py-12 md:py-16 bg-white" aria-labelledby="who-its-for-heading">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
        <h2 id="who-its-for-heading" className="text-4xl font-bold text-neutral-900 mb-4">
          {t("whoItsFor.title")}
        </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            {t("whoItsFor.subtitle")}
          </p>
        </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {personas.map((persona, index) => {
                    const isHighlighted = isPersonaHighlighted(index);
                    const isPrimary = isPersonaPrimary(index);
                    return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="group"
                    >
                      <div className={`p-6 h-full flex flex-col relative group rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                        isPrimary || isHighlighted
                          ? "border-blue-200 bg-blue-50/50 hover:border-blue-300" 
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}>
                        {/* Badge for Primary or Highlighted */}
                        {(isPrimary || isHighlighted) && (
                          <div className="absolute top-4 right-4">
                            <span className={`text-white text-xs px-2 py-1 rounded-full font-semibold shadow-sm ${
                              isPrimary ? 'bg-blue-600' : 'bg-green-600'
                            }`}>
                              {isPrimary ? 'Primary' : 'Recommended'}
                            </span>
                          </div>
                        )}
                
                {/* Header */}
                <div className="mb-4 text-center">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300 ${persona.iconBg}`}>
                    <span className="text-2xl">{persona.icon}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors duration-300 min-h-[2.5rem] flex items-center justify-center">
                    {persona.title}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed text-justify">
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
                    );
                  })}
                </div>


      </div>
    </section>
  );
}
