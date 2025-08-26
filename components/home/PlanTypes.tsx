"use client";

import { motion } from "framer-motion";

const types = [
  { title: "📘 Custom Business Plan", info: "15–35 pages. Submission-ready for Visa, Grants, Loans." },
  { title: "🔍 Upgrade & Review", info: "We revise your draft to pass institutional checks." },
  { title: "🧩 Strategy & Modelling", info: "4–8 pages. Define target group, pricing, positioning." },
];

export default function PlanTypes() {
  return (
    <div className="py-12 bg-gray-50">
      <h2 className="text-2xl font-bold text-center mb-8">Plan Types</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {types.map((t, idx) => (
          <motion.div
            key={idx}
            className="p-6 border rounded-lg shadow bg-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <h3 className="font-semibold mb-2">{t.title}</h3>
            <p className="text-sm text-gray-600">{t.info}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
