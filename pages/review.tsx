import Link from "next/link"

export default function Review() {
  return (
    <main className="max-w-3xl mx-auto py-16">
      <h1 className="text-3xl font-bold mb-6">Review Your Plan</h1>
      <p className="mb-8 text-gray-700">Here’s a preview of your content before moving forward.</p>
      <div className="flex justify-between">
        <Link href="/plan" className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">← Back</Link>
        <Link href="/preview" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Continue →</Link>
      </div>
    </main>
  )
}

