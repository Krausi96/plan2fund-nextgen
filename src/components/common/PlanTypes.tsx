import { motion } from "framer-motion";

const planTypes = [
  {
    id: "custom",
    title: "📘 Custom Business Plan",
    subtitle: "15–35 pages",
    description: "Complete business plan tailored to your funding requirements",
    bestFor: "visas, grants, bank loans",
    features: [
      "Tailored to selected provider",
      "Bank-ready financials", 
      "PDF/DOCX export"
    ]
  },
  {
    id: "upgrade",
    title: "🔍 Upgrade & Review",
    subtitle: "Existing drafts",
    description: "Revise and upgrade your existing plan to meet requirements",
    bestFor: "you already have a draft",
    features: [
      "Formatting & compliance review",
      "Expert edits & improvements",
      "PDF/DOCX export"
    ]
  },
  {
    id: "strategy",
    title: "🧩 Strategy & Modelling Plan",
    subtitle: "4–8 pages",
    description: "Business model and strategy for early-stage ideas",
    bestFor: "early-stage ideas, pivots",
    features: [
      "Business model outline",
      "Unit economics",
      "Upgrade path available"
    ]
  }
];

export function PlanTypes() {
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
            Choose your plan
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {planTypes.map((plan, index) => (
            <motion.a
              key={plan.id}
              href="/pricing#plans"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="block bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {plan.title}
                </h3>
                {plan.subtitle && (
                  <p className="text-sm text-gray-600 mb-3">{plan.subtitle}</p>
                )}
                <p className="text-sm text-gray-700 mb-4">{plan.description}</p>
                <p className="text-sm font-medium text-gray-800 mb-4">Best for: {plan.bestFor}</p>
              </div>

              <div className="mb-6">
                <ul className="space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-2 mt-0.5">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Single Section CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <a
            href="/pricing#plans"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
          >
            Compare plans →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
