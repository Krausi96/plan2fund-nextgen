import { motion } from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import Hero from "@/components/Hero";
import UseCases from "@/components/home/UseCases";
import PlanTypes from "@/components/home/PlanTypes";
import Included from "@/components/home/Included";
import Quote from "@/components/home/Quote";

export default function HomePage() {
  return (
    <AppShell showBreadcrumbs={false}>
      <div className="flex flex-col space-y-16">
        <motion.section><Hero ctaLabel="Start Your Plan" ctaHref="/reco" /></motion.section>
        <motion.section><UseCases /></motion.section>
        <motion.section><PlanTypes /></motion.section>
        <motion.section><Included /></motion.section>
        <motion.section><Quote /></motion.section>
      </div>
    </AppShell>
  );
}
