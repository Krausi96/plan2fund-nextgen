import { useRouter } from "next/router"
import Link from "next/link"
import Breadcrumbs from "@/components/layout/Breadcrumbs"

const programInfo: Record<
  string,
  { name: string; eligible: boolean; confidence: string; reason: string }
> = {
  "aws-preseed": {
    name: "AWS PreSeed",
    eligible: true,
    confidence: "High",
    reason: "Meets early-stage innovation criteria",
  },
  "ffg-basic": {
    name: "FFG Basisprogramm",
    eligible: true,
    confidence: "Medium",
    reason: "Some financial criteria partially met",
  },
  "bank-loan": {
    name: "Bank Loan",
    eligible: false,
    confidence: "Low",
    reason: "Insufficient financial history",
  },
}

export default function Eligibility() {
  const router = useRouter()
  const { program } = router.query
  const prog =
    typeof program === "string" ? programInfo[program] : undefined

  if (!prog)
    return (
      <main className="max-w-3xl mx-auto py-12">
        <Breadcrumbs />
        <h1 className="text-2xl font-bold">Invalid program</h1>
      </main>
    )

  return (
    <main className="max-w-3xl mx-auto py-12 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      <h1 className="text-2xl font-bold">Eligibility Check</h1>
      <p className="text-gray-600">Program: {prog.name}</p>

      <div className="p-6 rounded-xl border space-y-3">
        {/* Eligibility Badge */}
        <p>
          <span className="font-semibold">Eligibility: </span>
          {prog.eligible ? (
            <span className="text-green-600">✅ Eligible</span>
          ) : (
            <span className="text-red-600">❌ Not Eligible</span>
          )}
        </p>

        {/* Confidence Badge */}
        <p>
          <span className="font-semibold">Confidence: </span>
          <span className="text-blue-600">{prog.confidence}</span>
        </p>

        {/* Reason */}
        <p className="text-sm text-gray-500">{prog.reason}</p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/reco"
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          Adjust Answers
        </Link>

        {prog.eligible && (
          <Link
            href={{ pathname: "/plan", query: { program } }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Continue to Plan →
          </Link>
        )}
      </div>

      {/* Debug Panel Stub */}
      <div className="p-4 mt-6 bg-gray-100 rounded-lg text-xs text-gray-600">
        <p className="font-semibold">Debug Panel (Stub)</p>
        <p>Decision logic: {prog.reason}</p>
        <p>Confidence level: {prog.confidence}</p>
      </div>
    </main>
  )
}
