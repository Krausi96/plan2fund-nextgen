import { motion } from "framer-motion";

const planTypes = [
  {
    id: "strategy",
    title: "🧩 Strategy Document (Business Model & GTM)",
    subtitle: "4–8 pages",
    description: "Turn your idea into a clear **business model & go-to-market** you can build on.",
    features: [
      "Value prop, ideal customer, pricing & positioning",
      "First channels and launch plan (GTM)",
      "Unit economics (simple) + milestones / next steps"
    ],
    badges: ["DE/EN", "PDF/DOCX", "Edit anytime"],
    helper: "Start from scratch or paste notes per section."
  },
  {
    id: "review",
    title: "🔄 Update & Review (bring your text)",
    subtitle: "bring your text",
    description: "Paste what you have — we **structure, fix gaps & polish** it to the expected outline.",
    features: [
      "Gap notes by section (what's missing / needs rewrite)",
      "Financial tables added/tidied (revenue, costs, cash-flow, use of funds)",
      "Submission alignment for aws/FFG/Wirtschaftsagentur/bank/visa"
    ],
    badges: ["DE/EN", "PDF/DOCX", "Edit anytime"],
    helper: "No upload needed — paste directly into sections."
  },
  {
    id: "custom",
    title: "📘 Submission-Ready Business Plan",
    subtitle: "15–35 pages",
    description: "Application-ready plan in the order reviewers expect — for **grants, visas, or bank loans**.",
    features: [
      "Standard sections (Executive Summary → Financials)",
      "Tables: revenue, costs, cash-flow, use of funds",
      "Submission checklist (aws/FFG/WA/bank/visa)"
    ],
    badges: ["DE/EN", "PDF/DOCX", "Edit anytime"],
    helper: "Start clean or paste parts you've already written."
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
              href={`/pricing#${plan.id}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="block bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {plan.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: plan.description }}></p>
              </div>

              <div className="mb-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-2 mt-0.5">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {plan.badges.map((badge, badgeIndex) => (
                  <span key={badgeIndex} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {badge}
                  </span>
                ))}
              </div>

              {/* Helper text */}
              <p className="text-xs text-gray-500">{plan.helper}</p>
            </motion.a>
          ))}
        </div>

        {/* Add-on Pack mention */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-6"
        >
          <p className="text-sm text-gray-500">
            Optional <strong>Add-on Pack</strong>: Rush + extra revision + provider form help → <a href="/pricing#addons" className="text-blue-600 hover:text-blue-800 underline">/pricing#addons</a>
          </p>
        </motion.div>

      </div>
    </section>
  );
}
