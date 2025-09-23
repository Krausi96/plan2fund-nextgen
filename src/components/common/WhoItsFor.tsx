import { motion } from "framer-motion";

const audiences = [
  {
    title: "Visa Plans",
    description: "RWR / Freelance permit",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    emoji: "🗂",
  },
  {
    title: "Grants & Public Funding",
    description: "aws, FFG, Wirtschaftsagentur",
    color: "text-green-600",
    bgColor: "bg-green-50",
    emoji: "🧬",
  },
  {
    title: "Bank Loans & Leasing",
    description: "bank-friendly formatting",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    emoji: "📊",
  },
  {
    title: "Startup & Coaching Projects",
    description: "ideas, pivots, consulting",
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
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            Who is this for?
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {audiences.map((audience, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-300 text-center">
                <div className="text-2xl mb-2">{audience.emoji}</div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  {audience.title}
                </h3>
                <p className="text-xs text-neutral-600">
                  {audience.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <a
            href="/reco"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
          >
            See your matches →
          </a>
        </motion.div>

      </div>
    </section>
  );
}
