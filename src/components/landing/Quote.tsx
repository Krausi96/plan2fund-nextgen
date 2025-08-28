import { motion } from "framer-motion";

export function Quote() {
  return (
    <section className="py-16 bg-gray-50">
      <motion.div
        className="max-w-4xl mx-auto text-center px-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-semibold text-gray-900 mb-6">Why Plan2Fund?</h2>
        <p className="text-lg text-gray-600 italic relative">
          <span className="text-6xl text-blue-200 absolute -top-8 left-0">“</span>
          Whether you're shaping an idea, applying for funding or preparing a visa — 
          we turn your thoughts, drafts or existing business into a submission & funding-ready Business Plan.
          <span className="text-6xl text-blue-200 absolute -bottom-8 right-0">”</span>
        </p>
      </motion.div>
    </section>
  );
}
