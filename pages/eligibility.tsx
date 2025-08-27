import { useRouter } from "next/router";
import { Card } from "@/components/ui/card";
import EligibilityCard from "@/components/eligibility/EligibilityCard";
import Link from "next/link";

const mockPrograms = [
  { id: 1, name: "AWS PreSeed", eligible: true, confidence: "High" },
  { id: 2, name: "FFG Basisprogramm", eligible: true, confidence: "Medium" },
  { id: 3, name: "EU Startup Call", eligible: false, confidence: "Low" },
];

export default function EligibilityPage() {
  const router = useRouter();
  const programId = parseInt(router.query.program as string);
  const program = mockPrograms.find((p) => p.id === programId);

  if (!program) {
    return <div className="p-6">No program selected. Go back to results.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Eligibility Check</h1>
      <Card className="p-4 space-y-2">
        <h2 className="text-lg font-semibold">{program.name}</h2>
        <EligibilityCard eligible={program.eligible} confidence={program.confidence} />
      </Card>

      {program.eligible ? (
        <div className="mt-8 text-center">
          <Link href={`/plan?program=${program.id}`}>
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
