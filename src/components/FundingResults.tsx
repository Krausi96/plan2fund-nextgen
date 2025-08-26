import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FundingResultCard from "./FundingResultCard";

interface Program {
  programName: string;
  score: number;
  reason: string;
  eligibility: boolean;
  confidence: number;
  details: string;
}

const mockResults: Program[] = [
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
  {
    programName: "Wien Wirtschaftsagentur",
    score: 74,
    reason: "City-focused support for Vienna-based founders.",
    eligibility: true,
    confidence: 0.7,
    details: "Local funding from Wirtschaftsagentur Wien for startups.",
  },
  {
    programName: "Creative Europe",
    score: 68,
    reason: "Best for projects in cultural and creative sectors.",
    eligibility: true,
    confidence: 0.65,
    details: "EU program dedicated to creative industries and media projects.",
  },
];

export default function FundingResults() {
  const [selected, setSelected] = useState<Program | null>(null);

  return (
    <section id="funding-results" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Top Funding Recommendations
        </h2>

        {/* Results Grid with stagger animation */}
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.15 } },
          }}
        >
          {mockResults.map((program, idx) => (
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
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Modal popup */}
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
