import { motion } from "framer-motion";

const audiences = [
  {
    title: "Visa Applications",
    description: "Create professional business plans for visa applications like RWR and Freelance Permits.",
    features: ["RWR visa support", "Freelance permit applications", "Business plan compliance"],
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    emoji: "🗂",
  },
  {
    title: "Grants & Public Funding",
    description: "Access Austrian and EU funding programs including AWS PreSeed, FFG, and Horizon Europe.",
    features: ["AWS PreSeed funding", "FFG research grants", "EU startup programs"],
    color: "text-green-600",
    bgColor: "bg-green-50",
    emoji: "🧬",
  },
  {
    title: "Bank Loans or Leasing",
    description: "Structured business plans formatted to meet financial standards for traditional financing.",
    features: ["Bank loan applications", "Leasing agreements", "Financial compliance"],
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    emoji: "📊",
  },
  {
    title: "Startup, Coaching or Projects",
    description: "Support for startup ideas, self-employment, or consultant-supported business projects.",
    features: ["Startup projects", "Self-employment plans", "Consultant support"],
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    emoji: "👥",
  },
];

export function WhoItsFor() {
  return (
    <section className="section-padding bg-white">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">
            🧾 Use Cases
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Whether you're applying for visas, seeking grants, securing loans, or starting projects, 
            we have the tools and Austrian/EU funding programs for you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {audiences.map((audience, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="card-hover p-6 h-full flex flex-col relative group">
                {/* Emoji */}
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{audience.emoji}</div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {audience.title}
                </h3>
                <p className="text-neutral-600 mb-4 leading-relaxed flex-grow group-hover:text-neutral-700 transition-colors duration-300">
                  {audience.description}
                </p>
                
                {/* Hover Information Tooltip */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    Click to explore
                  </div>
                </div>
                
                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {audience.features.map((feature, featureIndex) => (
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
                  href={audience.title === "Bank Loans or Leasing" ? "/for?tab=banks" : 
                        audience.title === "Grants & Public Funding" ? "/reco" :
                        audience.title === "Visa Applications" ? "/for?tab=startups" :
                        "/for"}
                  className={`w-full px-4 py-2 ${audience.bgColor} ${audience.color} rounded-lg font-semibold text-center hover:opacity-80 transition-opacity group-hover:scale-105 transform transition-transform`}
                  title={`Learn more about ${audience.title.toLowerCase()}`}
                >
                  Learn more →
                </a>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
