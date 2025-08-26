"use client";

import { motion } from "framer-motion";

const cases = [
  { title: "Visa Applications", desc: "RWR, Freelance Permit" },
  { title: "Grants & Public Funding", desc: "AWS PreSeed, FFG, EU startup calls" },
  { title: "Bank Loans or Leasing", desc: "Structured + formatted to meet financial standards" },
  { title: "Startup & Coaching", desc: "Early ideas, projects supported by consultants" },
];

export default function UseCases() {
  return (
    <div className="py-12">
      <h2 className="text-2xl font-bold text-center mb-8">🧾 Use Cases</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {cases.map((c, idx) => (
          <motion.div
            key={idx}
            className="p-6 border rounded-lg shadow-sm bg-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <h3 className="font-semibold text-lg">{c.title}</h3>
            <p className="text-sm text-gray-600">{c.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
