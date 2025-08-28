import { motion } from "framer-motion";
import { ClipboardList, BarChart2, LineChart, FileText, Target, Globe } from "lucide-react";

const innerOrbit = [
  { Icon: ClipboardList, angle: 0 },
  { Icon: BarChart2, angle: 90 },
  { Icon: LineChart, angle: 180 },
  { Icon: FileText, angle: 270 },
];

const outerOrbit = [
  { Icon: Target, angle: 45 },
  { Icon: Globe, angle: 135 },
  { Icon: ClipboardList, angle: 225 },
  { Icon: BarChart2, angle: 315 },
];

export function Hero() {
  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Radial Glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-400 opacity-20 blur-3xl"></div>

      {/* Central Content */}
      <div className="relative z-20 text-center max-w-2xl px-6">
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-2">
          Freedom starts with a clear plan.
        </h1>
        <h2 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Let’s build yours.
        </h2>
        <p className="text-lg text-gray-600 mb-8">
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

      {/* Inner Orbit Icons */}
      {innerOrbit.map(({ Icon, angle }, i) => {
        const radius = 200;
        const x = radius * Math.cos((angle * Math.PI) / 180);
        const y = radius * Math.sin((angle * Math.PI) / 180);
        return (
          <motion.div
            key={`inner-${i}`}
            className="absolute flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-lg"
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x, y, opacity: 1 }}
            transition={{ duration: 1.5, delay: i * 0.2 }}
          >
            <Icon size={24} className="text-blue-600" />
          </motion.div>
        );
      })}

      {/* Outer Orbit Icons */}
      {outerOrbit.map(({ Icon, angle }, i) => {
        const radius = 320;
        const x = radius * Math.cos((angle * Math.PI) / 180);
        const y = radius * Math.sin((angle * Math.PI) / 180);
        return (
          <motion.div
            key={`outer-${i}`}
            className="absolute flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg"
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x, y, opacity: 1 }}
            transition={{ duration: 1.8, delay: i * 0.3 }}
          >
            <Icon size={28} className="text-blue-600" />
          </motion.div>
        );
      })}
    </section>
  );
}
