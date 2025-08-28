const cases = [
  { title: "Visa Applications", desc: "e.g. RWR, Freelance Permit", emoji: "🗂" },
  { title: "Grants & Public Funding", desc: "AWS PreSeed, FFG, EU startup calls", emoji: "🧬" },
  { title: "Bank Loans or Leasing", desc: "Structured + formatted to meet financial standards", emoji: "📊" },
  { title: "Startup, Coaching or Projects", desc: "Ideas, Self-employment, or consultant-supported projects", emoji: "👥" },
];

export function UseCases() {
  return (
    <section className="py-16">
      <h2 className="text-3xl font-semibold text-center mb-8">🧾 Use Cases</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cases.map((c, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl shadow bg-white hover:shadow-lg transform hover:-translate-y-2 transition"
          >
            <div className="text-4xl">{c.emoji}</div>
            <h3 className="font-bold mt-4">{c.title}</h3>
            <p className="text-sm text-gray-600">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
