import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const plans = [
  { 
    id: "strategy",
    title: "Strategy (4-8 pages)", 
    price: "€99", 
    desc: "Concise business strategy template for quick planning.", 
    features: ["Summary, Problem, ICP", "Strategy, GTM outline", "Next 90 days"],
    mode: "strategy"
  },
  { 
    id: "upgrade",
    title: "Upgrade & Review", 
    price: "€149", 
    desc: "Upload existing plan for professional review and enhancement.", 
    features: ["Formatting & Structure", "Financials review", "Funding fit analysis"],
    mode: "upgrade",
    featured: true
  },
  { 
    id: "custom",
    title: "Custom (15-35 pages)", 
    price: "€299", 
    desc: "Full business plan with all chapters and subchapters.", 
    features: ["Complete template", "Subchapters & checklists", "Professor tips"],
    mode: "custom"
  },
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
          <div key={i} className={`rounded-2xl border shadow-sm p-6 bg-white hover:shadow-md transition ${
            plan.featured ? 'border-blue-200 bg-blue-50' : ''
          }`}>
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
            <Link href={`/plan/intake?mode=${plan.mode}`} className="block mt-6">
              <Button className="w-full">
                {plan.mode === 'upgrade' ? 'Upload & Review' : `Choose ${plan.title.split(' ')[0]}`}
              </Button>
            </Link>
          </div>
        ))}
      </section>

      <section className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-6">Ready to get started?</h2>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <Link href="/plan" className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">Continue to Checkout</Link>
          <Link href="/checkout" className="px-6 py-3 rounded-xl border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50">Proceed to Checkout</Link>
        </div>
        <div className="flex justify-between max-w-xl mx-auto mt-8">
          <Link href="/preview" className="text-blue-600 hover:underline">← Back to Preview</Link>
          <Link href="/confirm" className="text-blue-600 hover:underline">Continue to Confirm →</Link>
        </div>
      </section>
    </main>
  );
}
