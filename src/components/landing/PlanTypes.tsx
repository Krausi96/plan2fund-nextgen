const plans = [
  {
    title: "📘 Custom Business Plan (15–35 pages)",
    info: "Full plan aligned with institutional & funding requirements. Ideal for visa, grant, or loan applications."
  },
  {
    title: "🔍 Upgrade & Review",
    info: "We revise and upgrade your draft with formatting, rewriting, and expert edits for AWS, FFG, banks or visa programs."
  },
  {
    title: "🧩 Strategy & Modelling Plan (4–8 pages)",
    info: "Shape your business model and strategy — perfect for early-stage ideas, pivots, or consulting clients."
  },
];

export function PlanTypes() {
  return (
    <section className="py-16">
      <h2 className="text-3xl font-semibold text-center mb-8">Plan Types</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((p, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl shadow bg-white hover:shadow-xl transform hover:-translate-y-2 transition flex flex-col justify-between"
          >
            <div>
              <h3 className="font-bold text-lg">{p.title}</h3>
              <p className="text-gray-600 text-sm mt-2">{p.info}</p>
            </div>
            <div className="mt-4">
              <a href="/plan" className="text-blue-600 font-semibold hover:underline">
                Read more →
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
