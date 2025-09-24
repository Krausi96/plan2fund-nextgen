import { motion } from "framer-motion";

const fundingTypes = [
  {
    id: "equity",
    title: "Equity",
    href: "/reco?type=equity"
  },
  {
    id: "national",
    title: "National grants",
    href: "/reco?type=national"
  },
  {
    id: "eu",
    title: "EU programs",
    href: "/reco?type=eu"
  },
  {
    id: "bank",
    title: "Bank loans & leasing",
    href: "/reco?type=bank"
  },
  {
    id: "coaching",
    title: "Coaching",
    href: "/reco?type=coaching"
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
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            Browse by funding type
          </h2>
        </motion.div>

        {/* Horizontal chip strip */}
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
          {fundingTypes.map((type, index) => (
            <motion.a
              key={type.id}
              href={type.href}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex-shrink-0 px-4 py-2 bg-white rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 group snap-center"
            >
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                {type.title}
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
