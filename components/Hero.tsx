"use client";
import { motion } from "framer-motion";
import Link from "next/link";

const floatingObjects = [
  "??", "??", "??", "??", "??"
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-24 text-center">
      <h1 className="text-5xl font-bold">Freedom starts with a clear plan</h1>
      <p className="mt-4 text-lg text-gray-600">
        Let’s build yours — funding, visas, or growth.
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <Link href="/reco" className="rounded-xl bg-blue-600 px-6 py-3 text-white shadow hover:bg-blue-700">
          Find Funding
        </Link>
        <Link href="/plan" className="rounded-xl border px-6 py-3 hover:bg-gray-50">
          Generate Plan
        </Link>
      </div>

      {/* Floating Icons */}
      {floatingObjects.map((icon, i) => (
        <motion.span
          key={i}
          className="absolute text-4xl"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: [0, -20, 0], opacity: 1 }}
          transition={{ duration: 6, repeat: Infinity, delay: i * 0.5 }}
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 20}%`,
          }}
        >
          {icon}
        </motion.span>
      ))}
    </section>
  );
}
