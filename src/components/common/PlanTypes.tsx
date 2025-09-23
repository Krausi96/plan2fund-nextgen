import { motion } from "framer-motion";

const planTypes = [
  {
    id: "custom",
    title: "📘 Custom Business Plan",
    subtitle: "15–35 pages",
    description: "Best for: visas, grants, bank loans",
    features: [
      "tailored narrative to requirements",
      "structured financials template", 
      "eligibility alignment",
      "PDF/DOCX export"
    ],
    cta: "See details",
    href: "/pricing#plans"
  },
  {
    id: "upgrade",
    title: "🔍 Upgrade & Review",
    subtitle: "",
    description: "Best for: you already have a draft",
    features: [
      "formatting + compliance review",
      "for aws/FFG/bank/visa",
      "rewriting edits",
      "PDF/DOCX export"
    ],
    cta: "Upload draft",
    href: "/pricing#plans"
  },
  {
    id: "strategy",
    title: "🧩 Strategy & Modelling Plan",
    subtitle: "4–8 pages",
    description: "Best for: early-stage ideas, pivots, consulting clients",
    features: [
      "business model & GTM outline",
      "unit economics sketch",
      "next-step plan",
      "upgrade path to full plan"
    ],
    cta: "Start strategy plan",
    href: "/pricing#plans"
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
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                  {plan.title}
                </h3>
                {plan.subtitle && (
                  <p className="text-sm text-gray-600 mb-2">{plan.subtitle}</p>
                )}
                <p className="text-sm text-gray-700 mb-4">{plan.description}</p>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-800 mb-2">You get:</p>
                <ul className="space-y-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={plan.href}
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors duration-300"
              >
                {plan.cta} →
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
