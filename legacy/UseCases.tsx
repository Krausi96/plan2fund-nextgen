const cases = [
  { title: "Visa Applications", desc: "e.g. RWR, Freelance Permit", emoji: "🗂" },
  { title: "Grants & Public Funding", desc: "AWS PreSeed, FFG, EU startup calls", emoji: "🧬" },
  { title: "Bank Loans or Leasing", desc: "Structured + formatted to meet financial standards", emoji: "📊" },
  { title: "Startup, Coaching or Projects", desc: "Ideas, Self-employment, or consultant-supported projects", emoji: "👥" },
];

export function UseCases() {
  return (
    <section className="py-16">
      <h2 className="text-3xl font-semibold text-center mb-12">🧾 Use Cases</h2>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {cases.map((c, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl shadow bg-white hover:shadow-xl transition flex flex-col"
          >
            <div className="text-4xl mb-4">{c.emoji}</div>
            <h3 className="font-bold text-lg text-gray-900">{c.title}</h3>
            <p className="text-gray-600 text-sm mt-2 flex-grow">{c.desc}</p>
            <a href="/reco" className="mt-4 text-blue-600 font-semibold hover:underline">
              Learn more →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
