import { motion } from "framer-motion";

const included = [
  "✔ A structured, submission-ready business plan",
  "✔ Delivered as Google Doc or Word (PDF optional)",
  "✔ Includes a 1-Page Executive Summary",
  "✔ Trust Agreement (NDA) signed by us",
  "✔ 1 free revision included",
  "✔ Async: No calls required, but support available",
];

export function Included() {
  return (
    <section className="py-16 bg-gray-50">
      <h2 className="text-3xl font-semibold text-center mb-8">What’s Included</h2>
      <ul className="max-w-xl mx-auto space-y-4 text-gray-700">
        {included.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className="flex items-center gap-2"
          >
            {item}
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
