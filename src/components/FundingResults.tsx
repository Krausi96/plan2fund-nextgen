import FundingResultCard from "./FundingResultCard";

const mockResults = [
  {
    programName: "AWS Preseed",
    score: 92,
    reason: "Strong fit for early-stage startups with tech focus.",
    eligibility: true,
    confidence: 0.9,
  },
  {
    programName: "FFG Basisprogramm",
    score: 85,
    reason: "Supports R&D projects with innovative potential.",
    eligibility: true,
    confidence: 0.8,
  },
  {
    programName: "EU Startup Call",
    score: 78,
    reason: "Suitable for international expansion initiatives.",
    eligibility: false,
    confidence: 0.75,
  },
];

export default function FundingResults() {
  return (
    <section id="funding-results" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Top Funding Recommendations
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockResults.map((program, idx) => (
            <FundingResultCard key={idx} {...program} />
          ))}
        </div>
      </div>
    </section>
  );
}
