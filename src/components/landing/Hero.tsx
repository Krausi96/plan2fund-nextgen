import { motion } from "framer-motion";
import { ClipboardList, BarChart2, FileText, Target, Briefcase, Users, DollarSign, TrendingUp, PieChart, Presentation } from "lucide-react";

const icons = [
  { Icon: ClipboardList, x: "10%", y: "15%" },
  { Icon: BarChart2, x: "80%", y: "20%" },
  { Icon: FileText, x: "20%", y: "70%" },
  { Icon: Target, x: "70%", y: "65%" },
  { Icon: Briefcase, x: "15%", y: "40%" },
  { Icon: Users, x: "85%", y: "50%" },
  { Icon: DollarSign, x: "30%", y: "25%" },
  { Icon: TrendingUp, x: "60%", y: "35%" },
  { Icon: PieChart, x: "40%", y: "80%" },
  { Icon: Presentation, x: "75%", y: "85%" },
];

export function Hero() {
  return (
    <section className="relative h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Background Floating Icons */}
      {icons.map(({ Icon, x, y }, i) => (
        <motion.div
          key={i}
          className="absolute opacity-30"
          style={{ left: x, top: y }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon size={48} className="text-blue-500" />
        </motion.div>
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
