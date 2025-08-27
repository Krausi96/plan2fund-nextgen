import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoredProgram } from "@/lib/recoEngine";
import Link from "next/link";

export default function ResultsPage() {
  const [results, setResults] = useState<ScoredProgram[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("recoResults");
    if (stored) {
      setResults(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Your Top Funding Matches</h2>
      <div className="grid gap-4">
        {results.map((program) => (
          <Card key={program.id} className="p-4 shadow-md rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold">{program.name}</h3>
              <span className="text-sm text-gray-600">{program.score}% Match</span>
            </div>
            <p className="text-sm mb-2">{program.reason}</p>
            <div className="flex gap-2 mb-4">
              <span className={`px-2 py-1 text-xs rounded ${program.eligibility === "Eligible" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {program.eligibility}
              </span>
              <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                Confidence: {program.confidence}
              </span>
            </div>
            <Link href={`/plan?programId=${program.id}`}>
              <Button>Continue to Plan Generator</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
