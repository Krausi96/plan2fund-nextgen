"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const floatingVariants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

interface HeroProps {
  ctaLabel?: string;
  ctaHref?: string;
}

export default function Hero({ ctaLabel = "Find Funding", ctaHref = "/reco" }: HeroProps) {
  return (
    <section className="relative flex flex-col items-center justify-center text-center py-24 bg-gradient-to-b from-blue-50 to-white">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl md:text-6xl font-bold mb-6"
      >
        Plan2Fund NextGen
      </motion.h1>

      <p className="max-w-xl text-gray-600 mb-6">
        From idea to funding-ready business plan — powered by AI and expert design.
      </p>

      <div className="flex gap-4">
        {/* Primary CTA from props */}
        <Button asChild>
          <a href={ctaHref}>{ctaLabel}</a>
        </Button>

        {/* Secondary CTA remains */}
        <Button variant="outline" asChild>
          <a href="/plan">Generate Plan</a>
        </Button>
      </div>

      {/* Floating objects */}
      <motion.div
        className="absolute top-10 left-10 w-12 h-12 bg-blue-200 rounded-full"
        variants={floatingVariants}
        animate="animate"
      />
      <motion.div
        className="absolute bottom-20 right-20 w-16 h-16 bg-green-200 rounded-full"
        variants={floatingVariants}
        animate="animate"
      />
    </section>
  );
}
