import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type ProgramResult = {
  id: string;
  name: string;
  type: string;
  score: number;
  reason: string;
  eligibility: string;
  confidence?: "High" | "Medium" | "Low";
  link?: string;
};

export default function ResultsPage() {
  const [results, setResults] = useState<ProgramResult[]>([]);
  const [freeText, setFreeText] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("recoResults");
    const freeTextReco = localStorage.getItem("freeTextReco");

    try {
      if (stored) {
        const parsed = JSON.parse(stored);

        // Handle both old array format and new API shape
        if (Array.isArray(parsed)) {
          setResults(parsed);
        } else if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          setResults(parsed.recommendations);
        }
      }
      if (freeTextReco) {
        setFreeText(freeTextReco);
      }
    } catch (err) {
      console.error("Failed to parse results:", err);
    }
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Your Funding Recommendations
      </h2>

      {/* Free text fallback */}
      {freeText && results.length === 0 && (
        <div className="p-4 border border-blue-300 bg-blue-50 rounded-lg text-center">
          <p className="text-blue-800 mb-2">
            You entered a free-text description. Our AI will analyze this in future updates.
          </p>
          <p className="italic text-sm">{freeText}</p>
          <Link href="/reco">
            <Button variant="destructive" className="mt-4">Go Back</Button>
          </Link>
        </div>
      )}

      {/* No results */}
      {!freeText && results.length === 0 && (
        <div className="p-4 border border-red-300 bg-red-50 rounded-lg text-center">
          <p className="text-red-700 mb-2 font-medium">
            No recommendations found. Please adjust your answers.
          </p>
          <Link href="/reco">
            <Button variant="destructive">Go Back</Button>
          </Link>
        </div>
      )}

      {/* Results list */}
      {results.length > 0 && (
        <div className="grid gap-4">
          {results.map((program) => (
            <Card key={program.id} className="p-4 shadow-md rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">{program.name}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    program.eligibility === "Eligible"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {program.eligibility}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2">{program.reason}</p>

              <div className="flex gap-2 items-center mb-2">
                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                  {program.score}% Match
                </span>
                <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                  {program.type}
                </span>
                {program.confidence && (
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      program.confidence === "High"
                        ? "bg-green-200 text-green-800"
                        : program.confidence === "Medium"
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    Confidence: {program.confidence}
                  </span>
                )}
              </div>

              {program.link && (
                <a
                  href={program.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  Learn more
                </a>
              )}

              <div className="mt-4">
                <Link href={`/plan?programId=${program.id}`}>
                  <Button className="w-full">Continue to Plan Generator</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
