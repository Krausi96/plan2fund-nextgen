import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FundingResultCard from "./FundingResultCard";
import ExplorationMode from "./ExplorationMode";
import { useNavigate } from "react-router-dom"; // ✅ add this

// ... keep your Program interface & initialResults unchanged ...

export default function FundingResults() {
  const [results, setResults] = useState<Program[]>(initialResults);
  const [selected, setSelected] = useState<Program | null>(null);
  const navigate = useNavigate(); // ✅ init router navigation

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
      {/* ... keep results grid & exploration mode unchanged ... */}

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
                <button
                  onClick={() => navigate("/plan")} // ✅ navigate to PlanPage
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                >
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
