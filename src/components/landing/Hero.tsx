import { motion, useScroll, useTransform } from "framer-motion";
import { ClipboardList, BarChart2, LineChart, FileText, Target, Globe, Briefcase, DollarSign, Users, TrendingUp } from "lucide-react";

const innerOrbit = [
  { Icon: ClipboardList, angle: 0 },
  { Icon: BarChart2, angle: 72 },
  { Icon: LineChart, angle: 144 },
  { Icon: FileText, angle: 216 },
  { Icon: Target, angle: 288 },
];

const outerOrbit = [
  { Icon: Globe, angle: 36 },
  { Icon: Briefcase, angle: 108 },
  { Icon: DollarSign, angle: 180 },
  { Icon: Users, angle: 252 },
  { Icon: TrendingUp, angle: 324 },
];

export function Hero() {
  const { scrollY } = useScroll();
  const yTransform = useTransform(scrollY, [0, 500], [0, 50]); // subtle parallax

  return (
    <section className="relative h-[100vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Radial Glow */}
      <motion.div 
        className="absolute w-[1000px] h-[1000px] rounded-full bg-blue-400 opacity-20 blur-3xl"
        style={{ y: yTransform }}
      ></motion.div>

      {/* Central Content */}
      <div className="relative z-20 text-center max-w-4xl px-6">
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-4 whitespace-nowrap">
          Freedom starts with a clear plan.
        </h1>
        <h2 className="text-6xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-700 bg-clip-text text-transparent mb-6 whitespace-nowrap">
          Let’s build yours.
        </h2>
        <p className="text-lg text-gray-600 mb-8 whitespace-nowrap">
          Built to meet standards of institutions, banks & public funding programs nationally & internationally.
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

      {/* Inner Orbit Icons (continuous rotation + parallax) */}
      {innerOrbit.map(({ Icon, angle }, i) => {
        const radius = 240;
        return (
          <motion.div
            key={`inner-${i}`}
            className="absolute flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg"
            style={{ y: yTransform }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
          >
            <motion.div
              style={{
                transform: `translate(${radius * Math.cos((angle * Math.PI) / 180)}px, ${radius * Math.sin((angle * Math.PI) / 180)}px)`,
              }}
            >
              <Icon size={28} className="text-blue-600" />
            </motion.div>
          </motion.div>
        );
      })}

      {/* Outer Orbit Icons (continuous rotation opposite) */}
      {outerOrbit.map(({ Icon, angle }, i) => {
        const radius = 380;
        return (
          <motion.div
            key={`outer-${i}`}
            className="absolute flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-lg"
            style={{ y: yTransform }}
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 80, ease: "linear" }}
          >
            <motion.div
              style={{
                transform: `translate(${radius * Math.cos((angle * Math.PI) / 180)}px, ${radius * Math.sin((angle * Math.PI) / 180)}px)`,
              }}
            >
              <Icon size={32} className="text-blue-600" />
            </motion.div>
          </motion.div>
        );
      })}
    </section>
  );
}
