import { CheckCircle } from "lucide-react";

const plans = [
  { title: "Basic Submission Plan", price: "€500 – €850", desc: "For short, form-based applications (AMS, WKO).", features: ["Submission-ready", "No hidden fees"] },
  { title: "Custom Business Plan", price: "€1.300 – €2.500", desc: "Visa, grants, or loan-ready detailed plans.", features: ["Grant-ready", "Investor-focused", "Visa compliant"] },
  { title: "Review / Upgrade", price: "€800 – €1.300", desc: "Upgrade or review your existing plan.", features: ["Detailed feedback", "Funding-alignment check"] },
  { title: "Strategy & Modelling", price: "€1.000 – €2.000", desc: "Business strategy and financial modelling.", features: ["Revenue modelling", "Cash flow analysis"] },
  { title: "Full Plan + Strategy Combo", price: "€2.000 – €5.000", desc: "Complete plan with strategy & modelling.", features: ["All-in-one package", "Ready for investors"] },
];

export default function Pricing() {
  return (
    <main className="bg-white">
      <section className="py-20 text-center bg-gradient-to-b from-gray-50 to-white">
        <h1 className="text-5xl font-bold mb-4">Pricing built for businesses of all sizes</h1>
        <p className="text-lg text-gray-600">Simple, transparent packages — choose the plan that fits your journey.</p>
      </section>

      <section className="max-w-6xl mx-auto py-12 grid md:grid-cols-3 gap-8 px-4">
        {plans.map((plan, i) => (
          <div key={i} className="rounded-2xl border shadow-sm p-6 bg-white hover:shadow-md transition">
            <h2 className="text-xl font-bold">{plan.title}</h2>
            <p className="text-gray-600 mt-2">{plan.desc}</p>
            <p className="text-lg font-semibold mt-4">{plan.price}</p>
            <ul className="mt-6 space-y-2">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-center space-x-2 text-gray-600">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-6">Ready to get started?</h2>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <a href="/plan" className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">Generate Business Plan</a>
          <a href="/reco" className="px-6 py-3 rounded-xl border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50">Find Funding</a>
        </div>
      </section>
    </main>
  );
}
