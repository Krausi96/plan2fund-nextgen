import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function AnimatedNumber({ value, duration = 2 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value.replace(/[^0-9]/g, "")); 
    if (start === end) return;

    let incrementTime = (duration * 1000) / end;
    let timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span>
      {count.toLocaleString()}
      {value.replace(/[0-9,]/g, "")}
    </span>
  );
}

export function Hero() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        {/* Left Column: Headline + CTA */}
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

        {/* Right Column: Animated Stats */}
        <div className="grid gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="p-6 bg-white shadow rounded-2xl text-center"
          >
            <div className="text-3xl font-bold text-blue-600">
              <AnimatedNumber value="1000000000" />€
            </div>
            <p className="text-lg text-gray-600">Funding Available Annually</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="p-6 bg-white shadow rounded-2xl text-center"
          >
            <div className="text-3xl font-bold text-blue-600">
              <AnimatedNumber value="30000" />+
            </div>
            <p className="text-lg text-gray-600">New Businesses / Year</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="p-6 bg-white shadow rounded-2xl text-center"
          >
            <div className="text-3xl font-bold text-blue-600">
              <AnimatedNumber value="25" />%
            </div>
            <p className="text-lg text-gray-600">Startup Growth YoY</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
