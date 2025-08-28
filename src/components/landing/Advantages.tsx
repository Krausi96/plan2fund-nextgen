import { motion } from "framer-motion";

const stats = [
  { label: "Startup Growth", value: "25% YoY" },
  { label: "Funding Access", value: "€1B+ annually" },
  { label: "New Businesses", value: "30,000+ / year" },
  { label: "EU Grants", value: "€500M+ available" },
];

export function Advantages() {
  return (
    <section className="py-16">
      <h2 className="text-3xl font-semibold text-center mb-8">
        🚀 Advantages of Starting a Business in Austria
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 text-center">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.3 }}
            className="p-6 bg-white shadow rounded-2xl"
          >
            <div className="text-2xl font-bold text-blue-600">{s.value}</div>
            <p className="text-gray-600">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
