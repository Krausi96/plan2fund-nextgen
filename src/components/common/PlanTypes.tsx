import { motion } from "framer-motion";
// import { useI18n } from "@/contexts/I18nContext";

export function PlanTypes() {
  // const { t } = useI18n();

  const planTypes = [
    {
      id: "strategy",
      title: "Strategy Document (Business Model & GTM) — 4–8 pages",
      icon: "💡", // Lightbulb for strategy/ideas
      subtitle: "Turn your idea into a clear business model & go-to-market you can build on — upgradeable to a full plan.",
      features: [
        "Business Model Canvas snapshot (9 blocks) with concise assumptions",
        "GTM essentials: target market, pricing, promotion, channels, sales tactics",
        "Unit economics (simple): price, unit cost, contribution margin, break-even",
        "Executive One-Pager (DE/EN); content carries over to the full plan"
      ],
      badges: ["DE/EN", "PDF/DOCX", "Edit anytime"],
      helper: "Recommended add-on: Add-on Pack for faster first draft and one extra revision.",
      href: "/pricing#strategy",
      hasRouteExtras: false
    },
    {
      id: "review",
      title: "Update & Review (improve your existing text)",
      icon: "✏️", // Edit pencil for review/update
      subtitle: "Paste your draft — we re-structure, complete missing parts, align to requirements, and polish.",
      features: [
        "Re-structure & completion (we add missing sections and financials)",
        "Readiness Check — cross-checked to grant/bank/visa/equity requirements",
        "Customization & formatting: DE/EN, tone, pagination, references/quotations"
      ],
      routeExtras: [
        "Budget sheet",
        "Work packages & timeline", 
        "Annex guidance",
        "Bank summary",
        "Investor teaser & cap table"
      ],
      badges: ["DE/EN", "PDF/DOCX", "Edit anytime"],
      helper: "Recommended add-on: Add-on Pack for rush, one extra revision, and provider form help (one standard form).",
      href: "/pricing#review",
      hasRouteExtras: true
    },
    {
      id: "custom",
      title: "Submission-Ready Business Plan — 15–35 pages",
      icon: "📋", // Clipboard for submission-ready documents
      subtitle: "Application-ready plan for grants, banks, visas, or equity investors — in the order reviewers expect.",
      features: [
        "Standard sections (Executive Summary → Financials)",
        "Financial tables: revenue, costs, cash-flow, use of funds",
        "Readiness Check — cross-checked to the chosen route's requirements"
      ],
      routeExtras: [
        "Budget sheet",
        "Work packages & timeline",
        "Annex guidance", 
        "Bank summary",
        "Investor teaser & cap table"
      ],
      badges: ["DE/EN", "PDF/DOCX", "Edit anytime"],
      helper: "Recommended add-on: Add-on Pack for rush, one extra revision, and provider form help (one standard form).",
      href: "/pricing#custom",
      hasRouteExtras: true
    }
  ];

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {planTypes.map((plan, index) => (
            <motion.a
              key={plan.id}
              href={plan.href}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="block bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-300 hover:-translate-y-2 transition-all duration-300 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`Learn more about ${plan.title}`}
            >
              {/* Header with icon and title */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mr-4 group-hover:bg-blue-100 transition-colors">
                    <span className="text-2xl">{plan.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                      {plan.title.split(' — ')[0]}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      {plan.title.split(' — ')[1]}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {plan.subtitle}
                </p>
              </div>

              {/* Key features - simplified */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Includes:</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="text-sm text-gray-600 flex items-start">
                      <svg className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Route extras - only for review and custom */}
              {plan.hasRouteExtras && plan.routeExtras && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Route extras (included when relevant):</h4>
                  <div className="flex flex-wrap gap-1">
                    {plan.routeExtras.map((extra, extraIndex) => (
                      <span key={extraIndex} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {extra}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Badges - more prominent */}
              <div className="flex flex-wrap gap-2 mb-4">
                {plan.badges.map((badge, badgeIndex) => (
                  <span key={badgeIndex} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">
                    {badge}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Learn more</span>
                  <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Add-on Pack mention */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-600">
            Optional <a href="/pricing#addons" className="text-blue-600 hover:text-blue-800 underline font-medium">Add-on Pack</a>: Rush + extra revision + provider form help.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
