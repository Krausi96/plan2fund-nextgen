import { useRouter } from "next/router"
import Link from "next/link"

const programInfo: Record<string, { name: string; eligible: boolean; confidence: string }> = {
  "aws-preseed": { name: "AWS PreSeed", eligible: true, confidence: "High" },
  "ffg-basic": { name: "FFG Basisprogramm", eligible: true, confidence: "Medium" },
  "bank-loan": { name: "Bank Loan", eligible: false, confidence: "Low" },
}

export default function Eligibility() {
  const router = useRouter()
  const { program } = router.query
  const prog = typeof program === "string" ? programInfo[program] : null

  if (!prog) return <main className="max-w-3xl mx-auto py-12">Invalid program</main>

  return (
    <main className="max-w-3xl mx-auto py-12 space-y-6">
      <h1 className="text-2xl font-bold">Eligibility Check</h1>
      <p className="text-gray-600">Program: {prog.name}</p>

      <div className="p-6 rounded-xl border">
        <p>
          <span className="font-semibold">Eligible:</span>{" "}
          {prog.eligible ? (
            <span className="text-green-600">Yes ✅</span>
          ) : (
            <span className="text-red-600">No ❌</span>
          )}
        </p>
        <p>
          <span className="font-semibold">Confidence:</span> {prog.confidence}
        </p>
      </div>

      <div className="flex justify-between">
        <Link href="/reco" className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">
          Adjust Answers
        </Link>
        {prog.eligible && (
          <Link
            href={{ pathname: "/plan", query: { program } }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue to Plan →
          </Link>
        )}
      </div>
    </main>
  )
}
