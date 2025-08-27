import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center">
      {/* Hero */}
      <section className="relative h-[80vh] flex flex-col items-center justify-center text-center bg-gradient-to-b from-blue-50 to-white w-full">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="text-4xl md:text-5xl font-bold mb-4"
        >
          Freedom starts with a clear plan — let’s build yours.
        </motion.h1>
        <p className="text-gray-600 mb-6 max-w-xl">
          Whether you're shaping an idea, applying for funding or preparing a visa — we turn your thoughts into submission-ready business plans.
        </p>
        <div className="flex gap-4">
          <Link href="/reco"><Button size="lg">Find Funding</Button></Link>
          <Link href="/plan"><Button variant="outline" size="lg">Generate Business Plan</Button></Link>
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-5xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-bold text-center mb-10">🧾 Use Cases</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Visa Applications", desc: "RWR, Freelance Permit" },
            { title: "Grants & Public Funding", desc: "AWS PreSeed, FFG, EU calls" },
            { title: "Bank Loans or Leasing", desc: "Structured for financial standards" },
            { title: "Startups & Projects", desc: "Early-stage ideas, coaching" }
          ].map((c, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.05 }}
              className="p-6 rounded-2xl border shadow-sm bg-white"
            >
              <h3 className="font-semibold">{c.title}</h3>
              <p className="text-sm text-gray-600">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Plan Types */}
      <section className="max-w-5xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-bold text-center mb-10">📘 Plan Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Custom Business Plan", desc: "15–35 pages, submission-ready" },
            { title: "Upgrade & Review", desc: "Revise and upgrade existing plans" },
            { title: "Strategy & Modelling Plan", desc: "Shape early-stage ideas" }
          ].map((c, i) => (
            <Card key={i} className="p-6 hover:shadow-md">
              <h3 className="font-semibold mb-2">{c.title}</h3>
              <p className="text-sm text-gray-600">{c.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* What’s Included */}
      <section className="max-w-3xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-bold text-center mb-6">🧾 What’s Included</h2>
        <ul className="space-y-2 text-gray-700">
          <li>✔ Submission-ready business plan</li>
          <li>✔ Delivered as Google Doc / Word (PDF optional)</li>
          <li>✔ Includes 1-page Executive Summary</li>
          <li>✔ NDA available</li>
          <li>✔ 1 free revision included</li>
          <li>✔ Async: no calls required, support available</li>
        </ul>
      </section>
    </main>
  )
}
