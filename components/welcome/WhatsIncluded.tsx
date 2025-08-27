export function WhatsIncluded() {
  const items = [
    "Structured, submission-ready business plan",
    "Google Doc / Word, PDF optional",
    "1-Page Executive Summary",
    "Trust Agreement (NDA) optional",
    "1 free revision included",
  ]
  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold mb-4">What’s Included</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="text-green-600">✔</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
