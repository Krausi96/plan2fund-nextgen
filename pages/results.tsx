import { Card, CardContent } from "@/components/ui/card";
import EligibilityCard from "@/components/eligibility/EligibilityCard";

const mockPrograms = [
  {
    id: 1,
    name: "AWS PreSeed",
    reason: "Early-stage tech funding in Austria",
    match: 92,
    eligible: true,
    confidence: "High",
  },
  {
    id: 2,
    name: "FFG Basisprogramm",
    reason: "Supports R&D projects with innovation potential",
    match: 85,
    eligible: true,
    confidence: "Medium",
  },
  {
    id: 3,
    name: "EU Startup Call",
    reason: "Pan-European funding for scaling companies",
    match: 78,
    eligible: false,
    confidence: "Low",
  },
];

export default function ResultsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Top Funding Matches</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {mockPrograms.map((program) => (
          <Card key={program.id} className="shadow-md hover:shadow-lg transition">
            <CardContent className="space-y-2 p-4">
              <h2 className="text-lg font-semibold">{program.name}</h2>
              <p className="text-sm text-muted-foreground">{program.reason}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Match: {program.match}%
                </span>
                <EligibilityCard
                  eligible={program.eligible}
                  confidence={program.confidence}
                />
              </div>
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg mt-3">
                Continue to Plan Generator →
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
