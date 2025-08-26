import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FundingResultCard from "./FundingResultCard";
import ExplorationMode from "./ExplorationMode";

interface Program {
  programName: string;
  score: number;
  reason: string;
  eligibility: boolean;
  confidence: number;
  details: string;
  userAdded?: boolean;
}

const initialResults: Program[] = [
  {
    programName: "AWS Preseed",
    score: 92,
    reason: "Strong fit for early-stage startups with tech focus.",
    eligibility: true,
    confidence: 0.9,
    details: "AWS Preseed supports Austrian tech startups with early grants.",
  },
  {
    programName: "FFG Basisprogramm",
    score: 85,
    reason: "Supports R&D projects with innovative potential.",
    eligibility: true,
    confidence: 0.8,
    details: "Basisprogramm funds R&D projects across industries.",
  },
  {
    programName: "EU Startup Call",
    score: 78,
    reason: "Suitable for international expansion initiatives.",
    eligibility: false,
    confidence: 0.75,
    details: "EU Startup Call provides pan-European funding opportunities.",
  },
];

export default function FundingResults() {
  const [results, setResults] = useState<Program[]>(initialResults);
  const [selected, setSelected] = useState<Program | null>(null);

  const handleAddProgram = (programName: string) => {
    const newProgram: Program = {
      programName,
      score: 0,
      reason: "Added manually by user.",
      eligibility: true,
      confidence: 0.5,
      details: `${programName} was added manually.`,
      userAdded: true,
    };
    setResults([...results, newProgram]);
  };

  return (
    <section id="funding-results" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Top Funding Recommendations
        </h2>

        {/* Results Grid */}
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.15 } },
          }}
        >
          {results.map((program, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              onClick={() => setSelected(program)}
              className="cursor-pointer"
            >
              <FundingResultCard {...program} />
              {program.userAdded && (
                <span className="mt-2 inline-block px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                  User Added
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Exploration Mode */}
      <ExplorationMode onAdd={handleAddProgram} />

      {/* Modal popup (unchanged) */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
              <h3 className="text-2xl font-bold mb-2">{selected.programName}</h3>
              <p className="text-gray-600 mb-4">{selected.details}</p>
              <div className="flex justify-end">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
                  Continue to Plan Generator →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
