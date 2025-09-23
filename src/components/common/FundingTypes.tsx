import { motion } from "framer-motion";

const fundingTypes = [
  {
    id: "equity",
    title: "Equity",
    description: "Business angels, venture capital, and investment opportunities",
    icon: "💰",
    href: "/reco?type=equity",
    chips: ["PreSeed", "Seed", "Series A"]
  },
  {
    id: "national",
    title: "National grants",
    description: "Austrian funding programs including AWS, FFG, and WA",
    icon: "🏛️",
    href: "/reco?type=national",
    chips: ["Basisprogramm", "Digitalisierung", "Innovation"]
  },
  {
    id: "eu",
    title: "EU funding programs",
    description: "Horizon Europe, EIC, and other European funding opportunities",
    icon: "🇪🇺",
    href: "/reco?type=eu",
    chips: ["Horizon Europe", "EIC", "Erasmus+"]
  },
  {
    id: "bank",
    title: "Bank loans & leasing",
    description: "Traditional financing options for established businesses",
    icon: "🏦",
    href: "/reco?type=bank",
    chips: ["Working capital", "Equipment", "Real estate"]
  },
  {
    id: "coaching",
    title: "Coaching / vouchers",
    description: "Support programs, consulting vouchers, and mentorship",
    icon: "🎯",
    href: "/reco?type=coaching",
    chips: ["Consulting", "Mentorship", "Training"]
  }
];

export function FundingTypes() {
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
            Funding types
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore different funding opportunities tailored to your business stage and needs
          </p>
        </motion.div>

        {/* Desktop: 2 rows grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fundingTypes.map((type, index) => (
            <motion.a
              key={type.id}
              href={type.href}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="block bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-300 group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                  {type.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {type.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{type.description}</p>
                  
                  {/* Starting points chips */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {type.chips.map((chip, chipIndex) => (
                      <span
                        key={chipIndex}
                        className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  
                  <div className="text-sm text-blue-600 font-medium group-hover:text-blue-700">
                    View options →
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Mobile: Horizontal scroll */}
        <div className="md:hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {fundingTypes.map((type, index) => (
              <motion.a
                key={type.id}
                href={type.href}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex-shrink-0 w-72 bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-300 group snap-center"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {type.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{type.description}</p>
                    
                    {/* Starting points chips */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {type.chips.map((chip, chipIndex) => (
                        <span
                          key={chipIndex}
                          className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                    
                    <div className="text-sm text-blue-600 font-medium group-hover:text-blue-700">
                      View options →
                    </div>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
