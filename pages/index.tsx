import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

const useCases = [
  { title: "Visa Applications", desc: "RWR, Freelance Permit", icon: "🗂" },
  { title: "Grants & Public Funding", desc: "AWS PreSeed, FFG, EU Calls", icon: "🧬" },
  { title: "Bank Loans or Leasing", desc: "Structured for financial standards", icon: "📊" },
  { title: "Startups & Projects", desc: "Early-stage ideas, coaching", icon: "👥" },
];

const planTypes = [
  { title: "📘 Custom Business Plan", desc: "15–35 pages, submission-ready", ideal: "Visa, Grants, Loans" },
  { title: "🔍 Upgrade & Review", desc: "Revise and upgrade existing plans", ideal: "Drafts needing structure & edits" },
  { title: "🧩 Strategy & Modelling Plan", desc: "Shape early-stage ideas", ideal: "Pivots, idea-stage, consulting" },
];

const whatsIncluded = [
  "Submission-ready business plan",
  "Delivered as Google Doc / Word (PDF optional)",
  "Includes 1-page Executive Summary",
  "NDA available",
  "1 free revision included",
  "Async: no calls required, support available"
];

export default function HomePage() {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative text-center py-20 overflow-hidden">
        {/* Floating Background Objects */}
        <motion.div
          className="absolute inset-0 flex justify-center items-center gap-10 text-6xl opacity-10"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <span>📊</span><span>📑</span><span>💡</span><span>📈</span>
        </motion.div>
        <h1 className="text-4xl font-bold relative z-10">
          Freedom starts with a clear plan — let’s build yours.
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto mt-4 relative z-10">
          Whether you’re shaping an idea, applying for funding or preparing a visa —
          we turn your thoughts into submission-ready business plans.
        </p>
        <div className="flex gap-4 justify-center mt-8 relative z-10">
          <Button asChild className="px-6 py-3 text-lg">
            <Link href="/reco">Find Funding</Link>
          </Button>
          <Button asChild variant="outline" className="px-6 py-3 text-lg">
            <Link href="/plan">Generate Business Plan</Link>
          </Button>
        </div>
      </section>

      {/* Quote Block */}
      <section className="text-center max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="text-xl italic text-gray-700"
        >
          Whether you're shaping an idea, applying for funding or preparing a visa —
          we turn your drafts or projects into a funding-ready Business Plan.
        </motion.p>
      </section>

      {/* Use Cases */}
      <section className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-center mb-10">🧾 Use Cases</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((c) => (
            <motion.div
              key={c.title}
              whileHover={{ scale: 1.05 }}
              className="border rounded-2xl p-6 shadow-sm bg-white"
            >
              <div className="text-4xl mb-4">{c.icon}</div>
              <h3 className="font-bold">{c.title}</h3>
              <p className="text-sm text-gray-600">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Plan Types */}
      <section className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-center mb-10">📘 Plan Types</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {planTypes.map((p) => (
            <motion.div
              key={p.title}
              whileHover={{ scale: 1.05 }}
              className="border rounded-2xl p-6 shadow-sm bg-white"
            >
              <h3 className="font-bold mb-2">{p.title}</h3>
              <p className="text-sm text-gray-600">{p.desc}</p>
              <p className="text-xs text-blue-600 mt-2">→ Ideal for: {p.ideal}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What’s Included */}
      <section className="max-w-4xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-center mb-10">✅ What’s Included</h2>
        <ul className="space-y-3">
          {whatsIncluded.map((item, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="flex items-center gap-3 text-gray-700"
            >
              <span className="text-green-600">✔</span> {item}
            </motion.li>
          ))}
        </ul>
      </section>
    </div>
  );
}
