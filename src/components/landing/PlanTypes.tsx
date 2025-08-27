const plans = [
  { title: "📘 Custom Business Plan (15–35 pages)", info: "Full plan aligned with institutional & funding requirements. Ideal for visa, grant, or loan/leasing applications when your business model is clear." },
  { title: "🔍 Upgrade & Review", info: "We revise and upgrade your existing draft — formatting, rewriting, and expert edits for AWS, FFG, banks or visa programs." },
  { title: "🧩 Strategy & Modelling Plan (4–8 pages)", info: "Shape your business model and strategy — ideal for early-stage ideas, pivots, or consulting clients." },
]

export function PlanTypes() {
  return (
    <section className="py-16">
      <h2 className="text-2xl font-semibold text-center mb-8">Plan Types</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((p, i) => (
          <div key={i} className="p-6 rounded-2xl shadow bg-white hover:shadow-lg transition">
            <h3 className="font-bold">{p.title}</h3>
            <p className="text-sm text-gray-600 mt-2">{p.info}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

