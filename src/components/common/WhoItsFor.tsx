import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export function WhoItsFor() {

  const personas = [
    {
      title: "Startup Founders",
      description: "Transform your idea into a professional business plan that investors and partners will take seriously.",
      features: [
        "Business Model Canvas with guided questions",
        "AI assistant for expert advice & content creation",
        "Readiness Check to ensure you have everything needed"
      ],
      perfectFor: "Pre-seed & early-stage funding",
      icon: "🚀",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
      href: "/reco?persona=solo",
      isPrimary: true
    },
    {
      title: "SMEs & Growing Businesses",
      description: "Create compelling business plans that showcase your growth potential and secure the resources you need.",
      features: [
        "Financial tables & cash flow projections",
        "Readiness Check for bank & investor requirements",
        "Route-specific documents (budget sheets, summaries)"
      ],
      perfectFor: "Bank loans & equity funding",
      icon: "📈",
      color: "text-green-600",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100",
      href: "/reco?persona=sme",
      isPrimary: false
    },
    {
      title: "Business Advisors",
      description: "Deliver consistent, high-quality business plans for all your clients with scalable tools.",
      features: [
        "Professional templates for different industries",
        "AI assistant for content creation & improvement",
        "Export in multiple formats (PDF, Word, PowerPoint)"
      ],
      perfectFor: "Client business plans",
      icon: "👥",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100",
      href: "/about#partners",
      isPrimary: false
    },
    {
      title: "Universities & Accelerators",
      description: "Empower your students and researchers with professional business planning tools and institutional support.",
      features: [
        "Professional templates for research projects",
        "AI assistant for academic writing & translation",
        "Readiness Check for EU & research programs",
        "Multiple export formats for different applications"
      ],
      perfectFor: "Universities, Accelerators, Research teams",
      icon: "🎓",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      iconBg: "bg-indigo-100",
      href: "/about#partners",
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
            Who is this for?
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            We have specific solutions for every target group
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
                
                {/* Compact Header */}
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
                
                {/* Perfect for */}
                <div className="mb-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Perfect for: {persona.perfectFor}
                  </div>
                </div>

                {/* Compact Features - 3 max */}
                <div className="flex-grow mb-4">
                  <ul className="space-y-2">
                    {persona.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-sm text-neutral-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Compact CTA */}
                <a 
                  href={persona.href}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-center hover:bg-blue-700 transition-all duration-300 group-hover:shadow-lg transform group-hover:scale-105"
                  title={`Learn more about ${persona.title.toLowerCase()}`}
                  aria-label={`Get started with ${persona.title}`}
                >
                  <span className="flex items-center justify-center">
                    Jetzt starten
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
