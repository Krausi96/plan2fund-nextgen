import { motion, useScroll, useTransform } from "framer-motion";
import { ClipboardList, BarChart2, LineChart, FileText, Target, Globe, Briefcase, DollarSign, Users, TrendingUp } from "lucide-react";

const scatteredIcons = [
  { Icon: ClipboardList, x: "-40%", y: "-20%" },
  { Icon: BarChart2, x: "30%", y: "-25%" },
  { Icon: LineChart, x: "45%", y: "20%" },
  { Icon: FileText, x: "-30%", y: "25%" },
  { Icon: Target, x: "20%", y: "35%" },
  { Icon: Globe, x: "-50%", y: "10%" },
  { Icon: Briefcase, x: "55%", y: "-10%" },
  { Icon: DollarSign, x: "-20%", y: "45%" },
  { Icon: Users, x: "40%", y: "50%" },
  { Icon: TrendingUp, x: "-45%", y: "50%" },
];

export function Hero() {
  const { scrollY } = useScroll();
  const yTransform = useTransform(scrollY, [0, 500], [0, 40]);

  return (
    <section className="relative h-[100vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Radial Glow */}
      <motion.div
        className="absolute w-[900px] h-[900px] rounded-full bg-blue-400 opacity-20 blur-3xl"
        style={{ y: yTransform }}
      ></motion.div>

      {/* Central Content */}
      <div className="relative z-20 text-center max-w-2xl px-6">
        <h1 className="text-5xl font-semibold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent leading-tight mb-4">
          Freedom starts with a clear plan.
        </h1>
        <h2 className="text-5xl font-semibold bg-gradient-to-r from-indigo-600 to-blue-700 bg-clip-text text-transparent leading-tight mb-6">
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

      {/* Scattered Pulsing Icons */}
      {scatteredIcons.map(({ Icon, x, y }, i) => (
        <motion.div
          key={i}
          className="absolute opacity-30"
          style={{ left: x, top: y }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 3 + i,
            ease: "easeInOut",
          }}
        >
          <Icon size={40} className="text-blue-600" />
        </motion.div>
      ))}
    </section>
  );
}
