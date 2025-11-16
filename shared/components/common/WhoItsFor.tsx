import { CheckCircle } from "lucide-react";
import { useI18n } from "@/shared/contexts/I18nContext";

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
    <section className="py-20 md:py-28 bg-white" aria-labelledby="who-its-for-heading">
      <div className="container max-w-7xl">
        <div className="text-center mb-16">
        <h2 id="who-its-for-heading" className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
          {t("whoItsFor.title")}
        </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t("whoItsFor.subtitle")}
          </p>
        </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {personas.map((persona, index) => {
                    const isHighlighted = isPersonaHighlighted(index);
                    const isPrimary = isPersonaPrimary(index);
                    return (
                    <div
                      key={index}
                      className="group"
                    >
                      <div className={`p-8 h-full flex flex-col relative group rounded-lg border transition-all duration-200 hover:shadow-md ${
                        isPrimary || isHighlighted
                          ? "border-blue-200 bg-gradient-to-br from-blue-50/50 to-white hover:border-blue-300" 
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}>
                        {/* Badge for Primary or Highlighted */}
                        {(isPrimary || isHighlighted) && (
                          <div className="absolute top-4 right-4">
                            <span className={`text-white text-xs px-2.5 py-1 rounded-full font-medium ${
                              isPrimary ? 'bg-blue-600' : 'bg-green-600'
                            }`}>
                              {isPrimary ? 'Primary' : 'Recommended'}
                            </span>
                          </div>
                        )}
                
                {/* Header */}
                <div className="mb-6 text-center">
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-4 ${persona.iconBg}`}>
                    <span className="text-2xl">{persona.icon}</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {persona.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    {persona.description}
                  </p>
                </div>

                {/* Features - 3 max */}
                <div className="flex-grow mt-auto">
                  <ul className="space-y-2.5">
                    {persona.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-blue-600 mr-2.5 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                      </div>
                    </div>
                    );
                  })}
                </div>


      </div>
    </section>
  );
}
