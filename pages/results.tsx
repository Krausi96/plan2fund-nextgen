import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import Link from "next/link";

const mockResults = [
  { program: "AWS PreSeed", match: 92 },
  { program: "FFG Basisprogramm", match: 79 },
  { program: "EU Startup Call", match: 55 },
  { program: "Bank Loan SME", match: 63 },
  { program: "Vienna Business Agency", match: 81 },
];

export default function ResultsPage() {
  return (
    <AppShell>
      <section className="py-12 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Top Matches for You</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockResults.map((r, i) => (
            <Card key={i} className="p-6 shadow-md">
              <h3 className="text-lg font-semibold">{r.program}</h3>
              <p className="text-sm text-gray-600">Match Score: {r.match}%</p>
              <Link href="/eligibility" className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Check Eligibility
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
