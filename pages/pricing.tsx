import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const plans = [
  { name: "Starter", price: "€19", features: ["Basic plan editor", "PDF export"] },
  { name: "Professional", price: "€49", features: ["Advanced editor", "Reco Wizard", "Priority support"] },
  { name: "Team", price: "€99", features: ["Collaboration", "Cloud autosave", "All templates"] },
  { name: "Business", price: "€199", features: ["Full export (DOCX, PDF)", "Custom branding", "Team workspace"] },
  { name: "Enterprise", price: "Custom", features: ["Dedicated support", "Custom integrations", "SSO/Compliance"] },
];

export default function Pricing() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-16 space-y-16">
      <section className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Pricing Plans</h1>
        <p className="text-lg text-gray-600">
          Flexible options for individuals, teams, and enterprises.
        </p>
      </section>

      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
        {plans.map((plan) => (
          <Card key={plan.name} className="shadow-lg rounded-2xl border p-6 text-center">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-2xl font-bold mt-2">{plan.price}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="space-y-1 text-sm text-gray-600">
                {plan.features.map((f, i) => (
                  <li key={i}>✔ {f}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center space-y-4">
        <p className="text-lg">Ready to get started?</p>
        <div className="flex justify-center gap-4">
          <Link href="/plan" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
            Generate Business Plan
          </Link>
          <Link href="/reco" className="px-6 py-3 border rounded-xl hover:bg-gray-100">
            Find Funding
          </Link>
        </div>
      </div>
    </main>
  );
}
