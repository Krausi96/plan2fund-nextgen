import { motion } from "framer-motion";

export function Hero() {
  const floatingItems = ["📊", "📑", "📈", "💼", "📅"];

  return (
    <section className="relative text-center py-20 bg-gradient-to-b from-blue-50 to-white overflow-hidden">
      {/* Floating Objects */}
      {floatingItems.map((item, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl opacity-30"
          initial={{ y: 0 }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4 + i, repeat: Infinity }}
          style={{ left: `${10 + i * 15}%`, top: `${20 + i * 10}%` }}
        >
          {item}
        </motion.div>
      ))}

      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        Freedom starts with a clear plan — let’s build yours.
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Built to meet standards of institutions, banks & public funding programs nationally & internationally.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/reco"
          className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
        >
          Find Funding
        </a>
        <a
          href="/plan"
          className="px-6 py-3 bg-gray-900 text-white rounded-xl shadow hover:bg-gray-700 transition"
        >
          Generate Business Plan
        </a>
      </div>
    </section>
  );
}
