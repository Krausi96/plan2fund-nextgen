import { motion } from "framer-motion";

const planTypes = [
  {
    id: "custom",
    title: "📘 Custom Business Plan",
    subtitle: "15–35 pages",
    oneLiner: "You've defined your model—vision, offer, market, target group, marketing, financials. We turn your input into a submission-ready plan aligned with institutional & funding requirements.",
    bestFor: "visas, grants, bank loans/leasing",
    features: [
      "narrative tailored to selected provider (aws/FFG/WA/bank/visa)",
      "structured financials template (bank/grant-ready)",
      "eligibility alignment + application checklist",
      "DE/EN · PDF/DOCX export"
    ]
  },
  {
    id: "upgrade",
    title: "🔍 Upgrade & Review",
    subtitle: "",
    oneLiner: "Already have a plan or draft? We revise and upgrade it to pass—formatting, structure, and expert edits for aws, FFG, banks, or visa programs.",
    bestFor: "drafts needing structure, compliance, or financial add-ons",
    features: [
      "gap analysis vs. chosen program/bank requirements",
      "rewriting + formatting to required structure",
      "missing sections/financials added",
      "DE/EN · PDF/DOCX export"
    ]
  },
  {
    id: "strategy",
    title: "🧩 Strategy & Modelling Plan",
    subtitle: "4–8 pages",
    oneLiner: "You've got an idea but key details (target group, pricing, positioning) aren't set. We shape your business model & strategy so you can move into development or a full plan.",
    bestFor: "early-stage ideas, pivots, consulting clients",
    features: [
      "business model & GTM outline (DE/EN)",
      "unit economics + next steps & milestones",
      "upgrade path to Custom Business Plan or Upgrade & Review"
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
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {plan.title}
                </h3>
                {plan.subtitle && (
                  <p className="text-sm text-gray-600 mb-2">{plan.subtitle}</p>
                )}
                
                {/* Badges row */}
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">DE/EN</span>
                  <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">PDF/DOCX</span>
                  <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">Eligibility alignment</span>
                </div>
                
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{plan.oneLiner}</p>
                <p className="text-sm font-medium text-gray-800 mb-4">Best for: {plan.bestFor}</p>
              </div>

              <div className="mb-6">
                <ul className="space-y-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-2 mt-0.5">•</span>
                      <span className="leading-relaxed">{feature}</span>
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
