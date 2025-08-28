import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function Quote() {
  const fullText =
    "Whether you're shaping an idea, applying for funding or preparing a visa — we turn your thoughts, drafts or existing business into a submission & funding-ready Business Plan.";
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="max-w-3xl mx-auto text-center text-xl text-gray-700 italic py-16">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {displayedText}
      </motion.p>
    </section>
  );
}
