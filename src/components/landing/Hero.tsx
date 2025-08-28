import { motion } from "framer-motion";
import { ClipboardList, BarChart2, Calendar, Target, Globe } from "lucide-react";

const orbitIcons = [
  { Icon: ClipboardList, angle: 0 },
  { Icon: BarChart2, angle: 72 },
  { Icon: Calendar, angle: 144 },
  { Icon: Target, angle: 216 },
  { Icon: Globe, angle: 288 },
];

export function Hero() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        {/* Left Column */}
        <div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Freedom starts with a clear plan — let’s build yours.
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-lg">
            Built to meet standards of institutions, banks & public funding programs
            nationally & internationally.
          </p>
          <div className="flex gap-4">
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

        {/* Right Column: Circular Ecosystem */}
        <div className="relative flex items-center justify-center h-96">
          {/* Central abstract circle */}
          <div className="w-40 h-40 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 opacity-80 shadow-xl"></div>

          {/* Orbiting icons */}
          {orbitIcons.map(({ Icon, angle }, i) => {
            const radius = 140;
            const x = radius * Math.cos((angle * Math.PI) / 180);
            const y = radius * Math.sin((angle * Math.PI) / 180);
            return (
              <motion.div
                key={i}
                className="absolute flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg"
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ x, y, opacity: 1 }}
                transition={{ duration: 1.2, delay: i * 0.2 }}
              >
                <Icon size={28} className="text-blue-600" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
