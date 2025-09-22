import { useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"

type Chapter = { id: string; title: string }

export default function PlanIntake() {
  const router = useRouter()
  const { programId, mode } = router.query as { programId?: string; mode?: string }
  const [brief, setBrief] = useState("")
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const seedChapters = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/intake/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, programId, mode }),
      })
      const data = await res.json()
      setChapters(data.chapters || [])
      // Save seed to localStorage to be read by Editor or other components
      localStorage.setItem("planSeed", JSON.stringify({ ...data, mode }))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      // Store file info for review mode
      localStorage.setItem("uploadedPlan", JSON.stringify({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }))
    }
  }

  const getModeTitle = () => {
    switch (mode) {
      case 'strategy': return 'Strategy Plan (4-8 pages)'
      case 'upgrade': return 'Upgrade & Review'
      case 'custom': return 'Custom Plan (15-35 pages)'
      default: return 'Plan Intake'
    }
  }

  return (
    <main className="max-w-3xl mx-auto py-12 space-y-6">
      <h1 className="text-2xl font-bold">{getModeTitle()}</h1>
      <p className="text-gray-600">
        {mode === 'upgrade' 
          ? 'Upload your existing plan for professional review and enhancement.'
          : 'Provide a short brief. We will seed plan chapters.'}
      </p>

      {mode === 'upgrade' ? (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-gray-500">
                {uploadedFile ? (
                  <div>
                    <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg">📄 Upload your business plan</p>
                    <p className="text-sm">PDF, DOC, or DOCX files accepted</p>
                  </div>
                )}
              </div>
            </label>
          </div>
          {uploadedFile && (
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                <strong>Will extract:</strong> Team CVs, Budget sheets, Financial projections, Market analysis
              </p>
            </div>
          )}
        </div>
      ) : (
        <textarea
          className="w-full border rounded p-3 h-40"
          placeholder="Describe your project, market, and goals..."
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
        />
      )}

      <div className="flex gap-3">
        {mode !== 'upgrade' && (
          <button
            onClick={seedChapters}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Seeding..." : "Seed Chapters"}
          </button>
        )}
        <Link
          href={{ pathname: "/editor", query: { ...(programId && { programId }), ...(mode && { mode }) } }}
          className="px-4 py-2 rounded border hover:bg-gray-50"
        >
          {mode === 'upgrade' ? 'Start Review →' : 'Continue to Plan →'}
        </Link>
      </div>

      {chapters.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mt-4">Proposed Chapters</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 mt-2">
            {chapters.map((c) => (
              <li key={c.id}>{c.title}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  )
}


