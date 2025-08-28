import { motion } from "framer-motion";
import { ClipboardList, BarChart2, Calendar, Target, Globe } from "lucide-react";

export function Hero() {
  const floatingIcons = [
    { Icon: ClipboardList, left: "10%", top: "20%" },
    { Icon: BarChart2, left: "30%", top: "40%" },
    { Icon: Calendar, left: "60%", top: "25%" },
    { Icon: Target, left: "75%", top: "50%" },
    { Icon: Globe, left: "50%", top: "70%" },
  ];

  return (
    <section className="relative text-center py-20 bg-gradient-to-b from-blue-600 to-blue-900 overflow-hidden text-white">
      {/* Floating Business Plan Objects */}
      {floatingIcons.map(({ Icon, left, top }, i) => (
        <motion.div
          key={i}
          className="absolute opacity-30"
          initial={{ y: 0 }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6 + i, repeat: Infinity }}
          style={{ left, top }}
        >
          <Icon size={48} />
        </motion.div>
      ))}

      <h1 className="text-5xl font-bold drop-shadow mb-6">
        Freedom starts with a clear plan — let’s build yours.
      </h1>
      <h2 className="text-2xl font-medium text-gray-100 drop-shadow mb-6">
        Built to meet standards of institutions, banks & public funding programs.
      </h2>
      <div className="flex justify-center gap-4">
        <a
          href="/reco"
          className="px-6 py-3 bg-white text-blue-700 rounded-xl shadow hover:bg-gray-100 transition font-semibold"
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
    </section>
  );
}
