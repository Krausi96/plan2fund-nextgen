export function Hero() {
  return (
    <section className="text-center py-20 bg-gradient-to-b from-blue-50 to-white">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">
        Freedom starts with a clear plan — let’s build yours.
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Built to meet standards of institutions, banks & public funding programs nationally & internationally.
      </p>
      <div className="flex justify-center gap-4">
        <a href="/reco" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
          Find Funding
        </a>
        <a href="/plan" className="px-6 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
          Generate Business Plan
        </a>
      </div>
    </section>
  )
}

