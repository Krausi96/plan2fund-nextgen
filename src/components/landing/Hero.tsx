import { motion } from "framer-motion";
import { ClipboardList, BarChart2, LineChart, FileText, Target, Briefcase, Users, DollarSign, PieChart, Presentation, TrendingUp } from "lucide-react";

const icons = [
  ClipboardList, BarChart2, LineChart, FileText, Target,
  Briefcase, Users, DollarSign, PieChart, Presentation, TrendingUp
];

function FloatingIcon({ Icon, index }) {
  const driftX = (index % 2 === 0 ? 1 : -1) * (30 + index * 3);
  const driftY = (index % 2 === 0 ? -1 : 1) * (20 + index * 2);

  return (
    <motion.div
      className="absolute opacity-30"
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={{
        x: [0, driftX, 0],
        y: [0, driftY, 0],
        opacity: [0.2, 0.4, 0.2],
        scale: [1, 1.1, 1]
      }}
      transition={{
        repeat: Infinity,
        duration: 12 + index * 2,
        ease: "easeInOut"
      }}
      style={{
        top: `${Math.random() * 80 + 5}%`,
        left: `${Math.random() * 80 + 10}%`
      }}
    >
      <Icon size={48} className="text-blue-500" />
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Floating Background Icons */}
      {icons.map((Icon, i) => (
        <FloatingIcon Icon={Icon} index={i} key={i} />
      ))}

      {/* Central Content */}
      <div className="relative z-20 text-center max-w-3xl px-6">
        <h1 className="text-6xl font-bold text-gray-900 leading-tight mb-4">
          Freedom starts with a clear plan.
        </h1>
        <h2 className="text-4xl font-semibold text-blue-700 leading-tight mb-6">
          Let’s build yours.
        </h2>
        <p className="text-xl text-gray-700 mb-8">
          Built to meet standards of institutions, banks & public funding programs
          nationally & internationally.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="/reco"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition font-semibold"
          >
            Find Funding
          </a>
          <a
            href="/plan"
            className="px-6 py-3 bg-gray-900 text-white rounded-xl shadow hover:bg-gray-700 transition font-semibold"
          >
            Generate Business Plan
          </a>
        </div>
      </div>
    </section>
  );
}
