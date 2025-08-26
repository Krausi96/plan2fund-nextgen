import { motion } from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import Hero from "@/components/Hero";
import UseCases from "@/src/components/home/UseCases";
import PlanTypes from "@/src/components/home/PlanTypes";
import Included from "@/src/components/home/Included";
import Quote from "@/src/components/home/Quote";

export default function HomePage() {
  return (
    <AppShell showBreadcrumbs={false}>
      <div className="flex flex-col space-y-16">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Hero
            ctaLabel="Start Your Plan"
            ctaHref="/reco"
          />
        </motion.section>

        {/* Use Cases */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <UseCases />
        </motion.section>

        {/* Plan Types */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <PlanTypes />
        </motion.section>

        {/* Included Features */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Included />
        </motion.section>

        {/* Quote/Testimonial */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Quote />
        </motion.section>
      </div>
    </AppShell>
  );
}
