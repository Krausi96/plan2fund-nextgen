import { useRouter } from "next/router"
import Link from "next/link"

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
      <h1 className="text-2xl font-bold">Recommended Programs</h1>
      <p className="text-gray-600">Based on your answers, here are some matches:</p>

      <div className="space-y-4">
        {mockPrograms.map((p) => (
          <div key={p.id} className="p-4 border rounded-xl flex justify-between items-center">
            <div>
              <h2 className="font-semibold">{p.name}</h2>
              <p className="text-sm text-gray-500">Match Score: {p.match}%</p>
            </div>
            <Link
              href={{ pathname: "/eligibility", query: { program: p.id } }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Check Eligibility
            </Link>
          </div>
        ))}
      </div>
    </main>
  )
}
