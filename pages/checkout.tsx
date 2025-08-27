import Link from "next/link"

export default function Checkout() {
  return (
    <main className="max-w-3xl mx-auto py-16">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <p className="mb-8 text-gray-700">Safe stub checkout (Stripe integration coming soon).</p>
      <div className="flex justify-between">
        <Link href="/confirmation" className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">← Back</Link>
        <Link href="/export" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Continue →</Link>
      </div>
    </main>
  )
}
