import { motion } from "framer-motion";

const planTypes = [
  {
    id: "custom",
    title: "📘 Custom Business Plan",
    subtitle: "15–35 pages",
    description: "Your model is defined. We turn it into a **submission-ready plan** reviewers can read quickly.",
    bestFor: "visas, grants, bank loans/leasing",
    features: [
      "Complete plan in the order reviewers expect (Exec Summary → Financials)",
      "Financial tables: revenue, costs, cash flow, use of funds",
      "Checklist matched to aws/FFG/Wirtschaftsagentur or bank requirements",
      "DE/EN · PDF/DOCX export"
    ],
    badges: ["DE/EN", "PDF/DOCX", "Checklist included"]
  },
  {
    id: "upgrade",
    title: "🔍 Upgrade & Review",
    subtitle: "bring your draft",
    description: "Have a plan or partial draft? We **fix structure, fill gaps, and polish** it to the required outline.",
    bestFor: "drafts needing structure/compliance/financial add-ons",
    features: [
      "Gap report vs. target outline (aws/FFG/WA/bank/visa)",
      "Rewrite + reformat; add missing sections/financials",
      "Track changes so you approve every edit",
      "DE/EN · PDF/DOCX export"
    ],
    badges: ["DE/EN", "PDF/DOCX", "Gap report"]
  },
  {
    id: "strategy",
    title: "🧩 Strategy & Modelling Plan",
    subtitle: "4–8 pages",
    description: "Idea not fully defined? We turn it into a **clear business model & go-to-market**.",
    bestFor: "early-stage ideas, pivots, consulting clients",
    features: [
      "Value prop, customer profile, pricing & positioning",
      "Unit economics + milestones / next steps",
      "Upgrade path to full Business Plan",
      "DE/EN deliverable"
    ],
    badges: ["DE/EN", "Short plan", "Upgrade path"]
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {plan.title}
                </h3>
                {plan.subtitle && (
                  <p className="text-sm text-gray-500 mb-3 font-medium">{plan.subtitle}</p>
                )}
                <p className="text-sm text-gray-700 mb-4" dangerouslySetInnerHTML={{ __html: plan.description }}></p>
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

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {plan.badges.map((badge, badgeIndex) => (
                  <span key={badgeIndex} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {badge}
                  </span>
                ))}
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

        {/* Disclaimer Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            We help you prepare your application; decisions are made by the providers.
          </p>
        </div>
      </div>
    </section>
  );
}
