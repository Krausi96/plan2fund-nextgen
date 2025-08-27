import { useRouter } from "next/router"
import Link from "next/link"
import Breadcrumbs from "@/components/layout/Breadcrumbs"
import { motion } from "framer-motion"

const mockPrograms = [
  { id: "aws-preseed", name: "AWS PreSeed", match: 85 },
  { id: "ffg-basic", name: "FFG Basisprogramm", match: 70 },
  { id: "bank-loan", name: "Bank Loan", match: 55 },
]

export default function Results() {
  const router = useRouter()
  const { answers } = router.query

  return (
    <main className="max-w-3xl mx-auto py-12 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      <h1 className="text-2xl font-bold">Recommended Programs</h1>
      <p className="text-gray-600">
        Based on your answers, here are some matches:
      </p>

      <div className="space-y-4">
        {mockPrograms.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="p-4 border rounded-xl flex justify-between items-center"
          >
            <div>
              <h2 className="font-semibold">{p.name}</h2>
              <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                Match: {p.match}%
              </span>
            </div>
            <Link
              href={{ pathname: "/eligibility", query: { program: p.id } }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Check Eligibility
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Back button */}
      <div className="pt-6">
        <Link
          href="/reco"
          className="text-blue-600 hover:underline text-sm"
        >
          ← Back to Wizard
        </Link>
      </div>
    </main>
  )
}
