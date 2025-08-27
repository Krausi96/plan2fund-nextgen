import { Card } from "@/components/ui/card";
import EligibilityCard from "@/components/eligibility/EligibilityCard";
import Link from "next/link";

const mockPrograms = [
  {
    id: 1,
    name: "AWS PreSeed",
    eligible: true,
    confidence: "High",
  },
  {
    id: 2,
    name: "FFG Basisprogramm",
    eligible: true,
    confidence: "Medium",
  },
  {
    id: 3,
    name: "EU Startup Call",
    eligible: false,
    confidence: "Low",
  },
];

export default function EligibilityPage() {
  const eligiblePrograms = mockPrograms.filter(p => p.eligible);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Eligibility Check</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {mockPrograms.map((program) => (
          <Card key={program.id} className="p-4 space-y-2">
            <h2 className="text-lg font-semibold">{program.name}</h2>
            <EligibilityCard
              eligible={program.eligible}
              confidence={program.confidence}
            />
          </Card>
        ))}
      </div>

      {eligiblePrograms.length > 0 ? (
        <div className="mt-8 text-center">
          <Link href="/plan">
            <button className="bg-blue-600 text-white py-2 px-4 rounded-lg">
              Continue to Plan Generator →
            </button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 text-center">
          <button className="bg-red-600 text-white py-2 px-4 rounded-lg">
            Adjust Answers
          </button>
        </div>
      )}
    </div>
  );
}
