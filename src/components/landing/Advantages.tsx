import { motion } from "framer-motion";

const stats = [
  { label: "Startup Growth", value: "25% YoY" },
  { label: "Funding Access", value: "€1B+ annually" },
  { label: "New Businesses", value: "30,000+ / year" },
  { label: "EU Grants", value: "€500M+ available" },
];

export function Advantages() {
  return (
    <section className="relative py-20 bg-gradient-to-r from-white to-gray-50 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <h2 className="text-3xl font-semibold text-center mb-12">
          🚀 Advantages of Starting a Business in Austria
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 text-center">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="p-8 bg-white shadow rounded-2xl"
            >
              <div className="text-4xl font-bold text-blue-600">{s.value}</div>
              <p className="text-lg text-gray-600">{s.label}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 mt-8">
          Source: Austrian Business Agency, FFG 2025
        </p>
      </div>
    </section>
  );
}
