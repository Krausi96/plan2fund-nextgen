const included = [
  "✔ A structured, submission-ready business plan",
  "✔ Delivered as Google Doc or Word (PDF optional, editable for reuse)",
  "✔ Includes a 1-Page Executive Summary",
  "✔ Trust Agreement (NDA) signed by us (optional)",
  "✔ 1 free revision if your plan needs adjustments",
  "✔ Async: No calls or meetings required",
]

export function Included() {
  return (
    <section className="py-16 bg-gray-50">
      <h2 className="text-2xl font-semibold text-center mb-8">What’s Included</h2>
      <ul className="max-w-xl mx-auto space-y-3 text-gray-700">
        {included.map((item, i) => (
          <li key={i} className="flex items-center gap-2">{item}</li>
        ))}
      </ul>
    </section>
  )
}

