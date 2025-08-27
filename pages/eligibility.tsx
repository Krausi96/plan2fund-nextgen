import AppShell from "@/components/layout/AppShell";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import EligibilityCard from "@/components/eligibility/EligibilityCard";
import Link from "next/link";

const mockResults = [
  { program: "AWS PreSeed", score: 92, eligible: true, confidence: "High" },
  { program: "EU Startup Call", score: 68, eligible: false, confidence: "Medium" },
  { program: "Vienna Business Agency", score: 81, eligible: true, confidence: "Low" },
];

export default function EligibilityPage() {
  return (
    <AppShell>
      <Breadcrumbs />
      <section className="py-12 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Eligibility & Confidence</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockResults.map((r, i) => (
            <EligibilityCard key={i} {...r} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/plan"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue to Business Plan Generator
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
