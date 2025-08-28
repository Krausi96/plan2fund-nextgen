import { motion } from "framer-motion";
import { ClipboardList, BarChart2, Calendar, Target, Globe } from "lucide-react";

export function Hero() {
  const floatingIcons = [
    { Icon: ClipboardList, left: "20%", top: "15%" },
    { Icon: BarChart2, left: "60%", top: "25%" },
    { Icon: Calendar, left: "40%", top: "60%" },
    { Icon: Target, left: "70%", top: "50%" },
    { Icon: Globe, left: "30%", top: "80%" },
  ];

  return (
    <section className="relative py-20 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        {/* Left Column: Headline + CTA */}
        <div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
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

        {/* Right Column: Floating Icons */}
        <div className="relative h-80 w-full">
          {floatingIcons.map(({ Icon, left, top }, i) => (
            <motion.div
              key={i}
              className="absolute opacity-30"
              initial={{ y: 0 }}
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6 + i, repeat: Infinity }}
              style={{ left, top }}
            >
              <Icon size={56} className="text-blue-600" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
