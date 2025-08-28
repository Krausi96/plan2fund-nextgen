import { motion } from "framer-motion";

export function Quote() {
  return (
    <section className="py-16 flex justify-center">
      <motion.div
        className="max-w-3xl bg-gradient-to-r from-gray-50 to-gray-100 shadow rounded-2xl p-10 relative"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <span className="absolute -top-6 -left-4 text-6xl text-blue-500 opacity-20">“</span>
        <p className="text-lg text-gray-600 italic text-center">
          Whether you're shaping an idea, applying for funding or preparing a visa — 
          we turn your thoughts, drafts or existing business into a submission & funding-ready Business Plan.
        </p>
        <span className="absolute -bottom-10 right-6 text-6xl text-blue-500 opacity-20">”</span>
      </motion.div>
    </section>
  );
}
