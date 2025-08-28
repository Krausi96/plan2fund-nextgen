import { motion } from "framer-motion";
import { ClipboardList, BarChart2, LineChart, FileText, Target, Globe } from "lucide-react";

const orbitIcons = [
  { Icon: ClipboardList, angle: 0 },     // Agenda
  { Icon: BarChart2, angle: 60 },        // Graph
  { Icon: LineChart, angle: 120 },       // Financial Start
  { Icon: FileText, angle: 180 },        // CV
  { Icon: Target, angle: 240 },          // Goals
  { Icon: Globe, angle: 300 },           // www / Global
];

export function Hero() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left Column: Headline + CTA */}
        <div className="relative z-10 md:pl-8">
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-2">
            Freedom starts with a clear plan.
          </h1>
          <h2 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            Let’s build yours.
          </h2>
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
          {/* Radial Glow Background */}
          <div className="absolute w-96 h-96 rounded-full bg-blue-400 opacity-30 blur-3xl"></div>

          {/* Central abstract gradient circle */}
          <div className="w-40 h-40 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 opacity-90 shadow-xl relative z-10"></div>

          {/* Orbiting icons */}
          {orbitIcons.map(({ Icon, angle }, i) => {
            const radius = 150;
            const x = radius * Math.cos((angle * Math.PI) / 180);
            const y = radius * Math.sin((angle * Math.PI) / 180);
            return (
              <motion.div
                key={i}
                className="absolute flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg"
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ x, y, opacity: 1 }}
                transition={{ duration: 1.5, delay: i * 0.2 }}
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
