import React from "react";
import { motion } from "framer-motion";
import QuestionWizard from "@/components/QuestionWizard";
import FundingResults from "@/components/FundingResults";

export default function RecoPage() {
  return (
    <main className="font-sans bg-gray-50 min-h-screen">
      {/* Header */}
      <section className="py-12 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <h1 className="text-4xl font-bold">Funding Recommendation Engine</h1>
        <p className="mt-2 text-lg opacity-90">
          Answer 3 quick questions and see your top funding matches.
        </p>
      </section>

      {/* Wizard */}
      <section className="max-w-3xl mx-auto py-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <QuestionWizard />
        </motion.div>
      </section>

      {/* Results */}
      <FundingResults />
    </main>
  );
}
